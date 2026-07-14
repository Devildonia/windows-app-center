# Fase 1 — Modelo de procesos aislados (Worker/iframe + IPC)

**Estado:** Etapa 1.0 implementada y verificada · **Objetivo:** que el Kernel pueda
*spawnear* procesos que corren **aislados** (Web Worker, y más adelante iframe) con un
canal IPC, en lugar de instanciar clases en su propio realm. Un `while(true)` en un
proceso ya no congela la UI.

> **Etapa 1.0 (hecha):** contrato IPC (`js/core/ipc/protocol.ts`); `WorkerProcess`
> (transporte inyectable → testeable sin Worker); `js/workers/compute.worker.ts` (demo,
> primos troceados + ping/pong + hang); `Kernel.spawnWorker/getWorker` con `kind:'worker'`;
> `ProcessWatchdog` (ping periódico → mata tras N pongs perdidos); `ComputeDemo`
> (`new Worker(new URL(...))` para bundle Vite). Tests: `WorkerProcess.test.js` (9).
> **Verificado en navegador:** worker real computa el 40000º primo off-thread mientras el
> hilo principal sigue respondiendo (89 ticks de setInterval durante 1.37s de cómputo);
> un worker colgado falla el ping (base del watchdog).

Es "el gran salto" del roadmap: en cuanto una app corre aislada y el Kernel la
spawnea/mata sin poder congelar la UI, deja de ser un simulador y pasa a ser un SO web.

---

## 1. Situación actual

- `Kernel.launch()` hace `new appInfo.appClass(params)` → la app vive en el **mismo hilo
  y realm** que el Kernel. `IProcess.instance: IWindowsApp`; `kill()` llama
  `instance.terminate()`.
- Ya existe aislamiento por **iframe sandboxed** para juegos/plugins
  (`WindowFactory.createGameWindow`) y el `PluginBridge` (allow-list por `contentWindow`).
- No hay procesos en Worker, ni IPC con contrato, ni watchdog.

## 2. Estrategia (escalonada, no rewrite)

Se **mantienen** las apps in-realm actuales. Se añade la infraestructura de procesos
aislados **en paralelo** y se prueba con un proceso Worker real. Migrar apps concretas a
procesos es incremental y posterior.

### Etapa 1.0 (esta) — Runtime de Worker + IPC + watchdog
- **Contrato IPC** (`js/core/ipc/protocol.ts`): envelopes tipados y versionados.
  - Sistema: `sys:ready` (worker→host), `sys:ping{id}` / `sys:pong{id}`.
  - App: `app` con `{ type, id?, payload?, error? }` (request/response por `id`).
- **`WorkerProcess`** (`js/core/WorkerProcess.ts`): envuelve un transporte
  (`IProcessTransport` = `postMessage`/`onMessage`/`terminate`). Un `Worker` real es un
  transporte; en tests se inyecta un transporte falso (loopback) → testeable sin Worker
  en jsdom, y reutilizable para transporte iframe en el futuro. Expone `ready`,
  `request(type,payload)`, `ping(timeout)`, `terminate()`.
- **Kernel**: `spawnWorker(appId, transport, opts)` asigna `pid`, mete el proceso en el
  `Map<pid>` (con `kind:'worker'`), emite `kernel:process-started`; `kill(pid)` termina el
  worker. Reutiliza el registro y eventos existentes.
- **`ProcessWatchdog`** (`js/core/ProcessWatchdog.ts`): pinguea los procesos worker cada
  N ms; tras M pongs perdidos consecutivos, mata el proceso vía Kernel. Expuesto para
  TaskManager.
- **Demo verificable**: worker de cómputo (`js/workers/compute.worker.ts`) que resuelve
  `compute:primes` off-thread (bloquearía la UI si corriera en el hilo principal),
  responde a ping, y puede "colgarse" a propósito para demostrar el watchdog.

### Etapas siguientes (1.x)
- SDK de app dentro del runtime (Worker/iframe): un pequeño runtime que carga la lógica de
  la app y habla el contrato IPC.
- Migrar una app de cómputo real a Worker; una app de UI no confiable a iframe con SDK.
- Generalizar el `PluginBridge` (allow-list por `contentWindow`) como autenticación de
  origen del proceso iframe (base de Fase 2 IPC/syscalls).

## 3. Contrato IPC (v1)

```ts
type SysMsg =
  | { ch: 'sys'; type: 'ready' }
  | { ch: 'sys'; type: 'ping'; id: number }
  | { ch: 'sys'; type: 'pong'; id: number };
type AppMsg = { ch: 'app'; type: string; id?: number; payload?: unknown; error?: string };
type ProcMsg = SysMsg | AppMsg;
```

Los `id` correlacionan request/response. El watchdog usa `sys:ping/pong`.

## 4. Casos duros / decisiones
- **Testabilidad:** `WorkerProcess` habla con un `IProcessTransport`, no con `Worker`
  directamente → unit-testeable en jsdom con un transporte loopback.
- **Vite + workers:** `new Worker(new URL('./compute.worker.ts', import.meta.url),
  { type: 'module' })` (Vite lo bundle-a). El transporte real vive en una fábrica aparte
  para no acoplar `WorkerProcess` a la API `Worker`.
- **Watchdog vs. cómputo legítimo largo:** el ping corre en el event loop del worker; un
  cómputo síncrono muy largo bloquea también el worker y perdería pings. Mitigación: los
  workers deben trocear el trabajo (yield) o responder ping desde un scope que no se
  bloquee. Para la demo, el cómputo se trocea.
- **IProcess.instance:** un proceso worker se representa con un adaptador mínimo
  (`{ windowId, terminate() }`) para encajar en `IProcess` sin romper la interfaz; se
  añade `kind?: 'app' | 'worker'`.

## 5. Criterio de aceptación 1.0
Kernel spawnea un Worker, computa off-thread sin congelar la UI, el watchdog mata un
worker colgado, TaskManager lista el proceso worker; typecheck + lint 0 errores + suite
verde con tests nuevos del contrato/WorkerProcess/watchdog.
