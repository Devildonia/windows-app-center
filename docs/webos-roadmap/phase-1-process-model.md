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

### Etapa 1.x (hecha) — App SDK + app real worker-backed
- **App Runtime SDK** (`js/sdk/appRuntime.ts`): runtime guest transport-agnóstico
  (`AppRuntime` + `IGuestTransport`; `workerGuestTransport` para Worker, MessagePort de
  iframe después). Anuncia `sys:ready`, auto-responde `sys:ping`→`pong`, y enruta requests
  `app` a handlers registrados con respuesta/error por id. El worker demo se reescribió
  sobre el SDK (solo declara sus handlers). Tests: `AppRuntime.test.js` (7).
- **App real worker-backed** (`js/apps/PrimeLab.ts`, icono de escritorio `data-launch`):
  ventana UI en el hilo principal que delega el cálculo de primos a un proceso Worker
  aislado gestionado por el Kernel; mata el worker al cerrarse. **Verificado en navegador:**
  computa el 30000º primo off-thread (350377, ~322 ms) con la UI respondiendo (43 ticks),
  y al cerrar la ventana el proceso worker desaparece (0 leaks).

### Etapa 1.y (hecha) — Canal MessagePort dedicado + proceso iframe
- **Transportes MessagePort**: `messagePortTransport` (host, en `WorkerProcess.ts`) y
  `messagePortGuestTransport`/`createPortRuntime` (guest, en `appRuntime.ts`) → el mismo
  `WorkerProcess`/`AppRuntime` habla por un canal punto-a-punto (de un `MessageChannel`),
  no el bus `window` global.
- **Proceso iframe** (`js/core/IframeProcess.ts` + `Kernel.spawnIframe`, `kind:'iframe'`):
  crea un iframe sandbox, hace un **handshake autenticado** — el host transfiere el
  MessagePort SOLO a su iframe (`contentWindow.postMessage(..., [port])`), y el guest lo
  acepta SOLO de `window.parent`. Es la autenticación de origen por proceso que generaliza
  el allow-list del `PluginBridge`. `kill()` cierra el puerto y elimina el iframe.
- **Guest con SDK** (`js/sdk/guestBoot.ts` + `process-guest.html`, entry de Vite): dentro
  del iframe corre un `AppRuntime` del SDK sobre el puerto. Tests: `PortProcess.test.js` (4,
  SDK end-to-end sobre un `MessageChannel`). **Verificado en navegador:** el guest anuncia
  ready por el puerto, responde `echo`/`reverse`/`ping`, y el iframe se elimina al matar el
  proceso.

> **Hallazgo (CSP):** la CSP endurecida del app (`script-src 'self'`) **bloquea scripts
> inline/cross-origin** en iframes `srcdoc`/opacos → un guest de origen opaco no puede
> cargar código bajo esta CSP. Por eso el guest se **sirve desde 'self'** y el iframe usa
> `allow-same-origin` (aislamiento de realm/documento + canal dedicado autenticado, pero
> mismo origen). El aislamiento de **origen opaco** para apps de terceros no confiables
> requiere servir los guests desde un **origen separado** (subdominio) — pendiente de
> despliegue, no de código.

### Etapas siguientes
- Servir guests de apps de terceros desde un origen separado para aislamiento de origen
  opaco real; migrar una app de UI existente a proceso iframe; empezar Fase 2 (syscalls
  `fs.*`/`window.*`/… sobre el canal por proceso, con el broker de permisos de Fase 3).

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
