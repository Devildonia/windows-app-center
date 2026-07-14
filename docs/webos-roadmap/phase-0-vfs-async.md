# Fase 0 — VFS async (IndexedDB + OPFS)

**Estado:** Etapa 0.1 implementada · Etapa 0.2 (OPFS) pendiente · **Objetivo:**
sustituir el backend `localStorage` de la VFS por almacenamiento async (IndexedDB para
el árbol/metadatos, OPFS para blobs binarios) sin reescribir el sistema, manteniendo la
interfaz `IVFS` como fachada estable.

> **Etapa 0.1 (hecha):** backend `js/core/VFSStore.ts` (IndexedDB + fallback
> localStorage, con migración legacy→IDB); `VFS.init()` async e idempotente;
> persistencia async debounced; `flush()`/`flushSync()`; flush en
> `visibilitychange → hidden`; boot en `main.ts` awaita `VFS.init()` antes de `initOS`.
> Lecturas (`resolve/readFile/listDir/getRoot`) siguen síncronas. Tests:
> `VFSStore.test.js` (fake-indexeddb) + round-trip en `VFS.test.js`.

Es el cimiento del roadmap Web OS: todo lo demás (procesos, permisos, paquetes)
asume un almacén de datos real y asíncrono.

---

## 1. Situación actual

- `VFS` es un módulo IIFE con un **árbol en memoria** (`root: IVFSNode`) y persistencia
  a `localStorage` (`STORAGE_KEY`), con guardado **debounced** (`save()`, 100 ms) y
  `flushSync()` para escrituras inmediatas.
- Toda la API de lectura es **síncrona** y opera sobre el árbol en memoria:
  `resolve`, `readFile`, `listDir`, `getRoot`.
- Las escrituras (`writeFile`, `mkdir`, `rename`, `deleteNode`) mutan el árbol en
  memoria y programan un `save()`.
- Límites ya presentes (auditoría previa): `MAX_FILE_BYTES` (~1 MB), `MAX_DEPTH` (32),
  validación de esquema en `init()`.

### Consumidores (inventario)

| Consumidor | Métodos | Contexto de ejecución |
|---|---|---|
| `Kernel.init()` | `init()` | Arranque del kernel (síncrono hoy) |
| `FileExplorer` | `resolve`, `readFile` | Dentro del render de carpetas/archivos |
| `Notepad` | `writeFile`, `listDir`, `readFile` | Abrir / guardar / listar |
| `Terminal` | `resolve`, `writeFile`, `mkdir`, `deleteNode`, `rename`, `listDir`, `flushSync` | Comandos |
| `ErrorBoundary` | `readFile`, `writeFile` | **Handler de errores no capturados (caso duro)** |
| `PluginBridge` | `writeFile`, `flushSync` | Handler de `postMessage` de plugin |
| `VFS` (self) | `flushSync` | `beforeunload` |

Limitaciones de `localStorage`: síncrono, ~5–10 MB, solo strings. Insuficiente para
un FS real (saves de juegos, imágenes, ejecutables de apps de terceros).

---

## 2. Decisión de arquitectura: migración por etapas (híbrida)

**Se mantiene un árbol en memoria como copia de trabajo** (igual que un SO cachea
inodes), y se hace **asíncrona la persistencia**. Esto evita convertir cada `resolve()`
en mitad de código de render síncrono a async de golpe (cambio grande y arriesgado con
poco beneficio inmediato). Dos etapas entregables por separado:

### Etapa 0.1 — Backend IndexedDB (esta etapa)
- Reemplazar `localStorage` por **IndexedDB** como almacén del árbol serializado.
- `init()` pasa a `async` (hidrata el árbol desde IDB una vez al arrancar). El boot
  (`Kernel.init`) pasa a `async` y se hace `await` en `main.ts`.
- `save()` persiste a IDB de forma async y debounced; el árbol en memoria sigue siendo
  la fuente de verdad para lecturas → **`resolve/readFile/listDir/getRoot` siguen
  síncronos** (cero churn en rutas de render).
- Migración de datos: al primer arranque, si existe el `localStorage` antiguo, se
  importa a IDB y se marca migrado.
- Beneficio inmediato: cuota de cientos de MB, almacenamiento estructurado, sin romper
  consumidores.

### Etapa 0.2 — OPFS para blobs binarios + carga perezosa
- Nodos `file` grandes/binarios guardan en el árbol solo **metadatos**
  (`name`, `type`, `size`, `blobRef`); el contenido vive en **OPFS**.
- Nuevos métodos async: `readFileAsync(path): Promise<string | Blob>` y
  `writeFileAsync(path, name, data)`. El contenido deja de vivir en memoria.
- Migrar consumidores que abren/guardan contenido (Notepad, FileExplorer preview) a las
  variantes async. La API síncrona se conserva para texto pequeño/compatibilidad.
- `navigator.storage.estimate()` / `persist()` para cuota y persistencia real.

---

## 3. Interfaz objetivo (`IVFS`)

```ts
interface IVFS {
  // Ciclo de vida (async tras 0.1)
  init(): Promise<void>;
  flush(): Promise<void>;          // reemplaza el debounce interno cuando se necesita durar
  // Lectura sobre el árbol en memoria (SÍNCRONA — metadatos/estructura)
  resolve(path: string): IVFSNode | null;
  listDir(path: string): string[] | null;
  getRoot(): IVFSNode | null;
  readFile(path: string): string | null;        // texto pequeño (compat 0.1)
  // Escritura (mutación en memoria + persist async programado)
  writeFile(path: string, name: string, content: string): boolean;
  mkdir(path: string, name: string): boolean;
  rename(parentPath: string, oldName: string, newName: string): boolean;
  deleteNode(parentPath: string, name: string): boolean;
  // Contenido grande/binario (0.2, OPFS)
  readFileAsync(path: string): Promise<string | Blob | null>;
  writeFileAsync(path: string, name: string, data: string | Blob): Promise<boolean>;
  // Test/HMR
  __reset(): void;
}
```

`flushSync()` se conserva como alias/compat durante 0.1 (llama a `flush()` best-effort).

---

## 4. Casos duros

1. **Crash log de `ErrorBoundary`.** Se escribe durante un error no capturado, posiblemente
   con la página muriendo. IDB no garantiza flush síncrono. Mitigación: la escritura al
   árbol en memoria es síncrona (el log se captura al instante) **y** se mantiene un
   espejo en `localStorage` solo para `crash.log` (best-effort inmediato), reconciliado
   a IDB en el siguiente flush.
2. **Persistencia al salir.** `beforeunload` no garantiza que una escritura IDB async
   complete. Mitigación estándar: flush también en `visibilitychange → hidden` (más
   fiable) y debounce corto. Documentar que la durabilidad es best-effort en cierre
   abrupto.
3. **Orden de arranque.** `init()` async obliga a `await` en el boot antes de montar
   apps que leen la VFS. Revisar `Kernel.init` y `main.ts`.
4. **Tests.** `test/setup.js` y `VFS.test.js` asumen API síncrona e `init()` síncrono +
   `localStorage`. Adaptar a `await VFS.init()` y mock/fake de IDB (`fake-indexeddb` ya
   es dependencia habitual en jsdom; verificar o añadir).

---

## 5. Plan de implementación (Etapa 0.1)

1. Añadir un backend de almacenamiento `VFSStore` (IndexedDB) con `load()/save()/clear()`
   async y fallback a `localStorage` si IDB no está disponible.
2. Migrar `VFS.save()/flushSync()` para delegar en `VFSStore` (async, debounced).
3. Convertir `VFS.init()` en `async`: hidratar desde IDB; si vacío, importar del
   `localStorage` legado; si no, `DEFAULT_FS`.
4. `Kernel.init()` → `async`, `await VFS.init()`; `main.ts` hace `await` en el boot.
5. `beforeunload` + `visibilitychange` → `flush()`.
6. Tests: `await VFS.init()`; añadir `fake-indexeddb`; test de migración
   localStorage→IDB; mantener los tests de hardening (colisión, rename, tamaño, esquema).

Criterio de aceptación 0.1: la app arranca, persiste y recupra el FS vía IndexedDB; los
consumidores síncronos no cambian; 558+ tests verdes; sin regresiones de lint/typecheck.

---

## 6. Fuera de alcance (fases siguientes)

- Namespacing de VFS por app (Fase 3 — permisos).
- Contrato de syscalls `fs.*` sobre IPC (Fase 2).
- Formato de paquete `.wapp` con assets en OPFS (Fase 4).
