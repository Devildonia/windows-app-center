# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.6.6] - 2026-07-15

This release turns the desktop simulator into a real **Web OS**: a full 6-phase roadmap
(async file system → isolated processes → mediated syscalls → user-consented permissions →
app packaging → session resume), plus the remediation of a full architecture audit. Design
notes for every phase live in `docs/webos-roadmap/`.

### Added
- **Session resume + window snapping (Web OS roadmap, Fase 5)**: The desktop now remembers your
  session — which apps are open and their window layout — and restores it on reload. A new
  `SessionManager` snapshots the windowed apps (worker/iframe children are skipped; their app
  respawns them), persists to `C:\WINDOWS\SYSTEM\session.json` on process/layout changes, and
  replays it at boot by relaunching each app and re-applying its geometry. Windows also gain
  **Aero-style snapping**: drop a window against the top edge to maximize, or the left/right edge
  to fill that half of the work area (the taskbar stays clear). Note: the roadmap's surface-based
  compositor was deliberately **not** built — these apps render as DOM, so the browser already
  composes them; a surface rewrite would cost everything the DOM gives for free and buy nothing.
  See `docs/webos-roadmap/phase-5-session-compositor.md`.
- **App packaging: manifest, versioned install/update/uninstall, local registry (Web OS roadmap, Fase 4)**:
  Apps can now be installed as packages (`.wapp` — a manifest plus its files). The `app.json`
  manifest declares id, semver version, entry and the capabilities the app may request; a new
  `PackageManager` validates it, writes the files into the app's own home (`C:\APPS\<id>`),
  stamps a SHA-256 integrity hash, and records it in a registry persisted in the VFS. Installing
  the same or an older version is refused; a newer one performs a clean update (stale files
  removed); uninstall removes the home, the registry entry and every permission grant. The
  manifest's declared permissions become the ceiling the `PermissionBroker` enforces — an
  undeclared capability is refused outright without prompting, while declared ones still ask for
  consent at first use. The container is swappable (a zip loader plugs in without touching the
  manager). See `docs/webos-roadmap/phase-4-packaging.md`.
- **Permission consent + per-app home directories (Web OS roadmap, Fase 3)**: The static
  capability set from Fase 2 is replaced by a `PermissionBroker` that asks the user to allow or
  deny a capability (`fs:read`, `fs:write`, `notify`, …) the first time a process uses it, then
  remembers the decision (persisted in the VFS at `C:\WINDOWS\SYSTEM\permissions.json`). Each
  process now gets its own home directory (`C:\APPS\<appId>`), and its `fs.*` syscalls are
  confined there by default instead of a shared folder. So an isolated process is gated by both
  consent (which capabilities) and confinement (where). See `docs/webos-roadmap/phase-3-permissions.md`.
- **Syscalls over the process channel (Web OS roadmap, Fase 2)**: Isolated processes
  (Worker/iframe) can now reach system services only through mediated *syscalls* on their
  dedicated channel, never directly. IPC is now full-duplex — the guest App SDK gains
  `syscall(name, args)` and the host `WorkerProcess` routes inbound requests. A new
  `SyscallBroker` serves `sys.log`, `notify`, `fs.read`, `fs.list`, and `fs.write` against the
  real VFS/Notify, guarded by a per-process capability set and an `fsRoot` that confines `fs.*`
  paths (Fase 3 below replaces that static set with user consent, and the root with a per-app
  home). Verified: an iframe process writes a file via `fs.write`, and a write outside its
  `fsRoot` is denied. See `docs/webos-roadmap/phase-2-syscalls.md`.
- **Iframe processes over a dedicated MessagePort (Web OS roadmap, Fase 1.y)**: Processes can
  now run in a sandboxed iframe that talks to the Kernel over a dedicated, authenticated
  `MessagePort` instead of the global `window` bus. New MessagePort transports (host + guest)
  let the same `WorkerProcess`/App SDK run over a point-to-point channel; `Kernel.spawnIframe()`
  performs an authenticated handshake (the host transfers the port only to its own iframe; the
  guest accepts it only from `window.parent`) — the per-process origin auth that generalizes the
  PluginBridge allow-list. The App SDK runs inside the iframe guest (`js/sdk/guestBoot.ts`).
  Note: the app's strict CSP (`script-src 'self'`) blocks inline/opaque-origin guest scripts, so
  guests are served from `'self'` with `allow-same-origin`; full opaque-origin isolation for
  untrusted third-party apps requires a separate origin (see docs/webos-roadmap).
- **App Runtime SDK + Prime Lab (Web OS roadmap, Fase 1.x)**: A small guest-side SDK
  (`js/sdk/appRuntime.ts`) lets an isolated app speak the process IPC protocol declaratively
  — it announces readiness, auto-answers watchdog pings, and routes requests to registered
  handlers. The compute worker now runs on it. **Prime Lab** (new desktop app) is the first
  real app whose heavy work runs in an isolated worker process: the UI window stays on the
  main thread and delegates the prime search over IPC, so it never freezes; closing the
  window kills the worker process.
- **Isolated process model — Web Worker processes + IPC + watchdog (Web OS roadmap, Fase 1.0)**:
  The Kernel can now spawn processes that run in a real Web Worker instead of the Kernel's
  own realm, so heavy work no longer freezes the UI. New pieces: a versioned IPC protocol
  (`js/core/ipc/protocol.ts`), a transport-agnostic `WorkerProcess` host handle
  (`ready`/`request`/`ping`/`terminate`), `Kernel.spawnWorker()` / `getWorker()` (processes
  tagged `kind:'worker'`), and a `ProcessWatchdog` that pings workers and kills unresponsive
  ones. Demo: `compute.worker.ts` computes primes off-thread (verified: the main thread stays
  responsive during a multi-second compute). See `docs/webos-roadmap/phase-1-process-model.md`.
- **Binary file storage in the VFS + Paint "Save as PNG" (Web OS roadmap, Fase 0.2)**:
  The VFS can now store binary/large files out of the JSON tree via a new `VFSBlobStore`
  backend (**OPFS** when available, IndexedDB otherwise, in-memory last resort). Nodes
  keep only a `blobRef`/`size`/`mime`; new `VFS.writeFileAsync()` / `VFS.readFileAsync()`
  handle Blobs (strings still go inline), and orphaned blobs are freed on delete/overwrite.
  First consumer: **Paint** gains a 💾 toolbar button that exports the canvas as a PNG to
  `C:\DOCUMENTS`.

### Changed
- **VFS storage backend → IndexedDB (Web OS roadmap, Fase 0.1)**: The virtual file
  system now persists to **IndexedDB** (new `VFSStore` backend) instead of
  `localStorage`, escaping the ~5–10 MB cap. `VFS.init()` is now async and idempotent;
  writes persist asynchronously (debounced) with an awaitable `flush()`. An in-memory
  tree remains the working copy, so reads (`resolve`/`readFile`/`listDir`/`getRoot`)
  stay synchronous and consumers are unchanged. Legacy `localStorage` trees migrate into
  IndexedDB automatically on first load; a `localStorage` fallback covers environments
  without IndexedDB. Durability flush now also triggers on `visibilitychange → hidden`.
  See `docs/webos-roadmap/phase-0-vfs-async.md`.

### Fixed
- **Architecture audit remediation**: Closed all 10 findings from the v1.6.5 audit —
  PluginBridge message-origin trust (allow-listed plugin frames), per-instance WebGL
  resource ownership for the ragdoll pet vs. Workshop viewer, removal of the O(100k)
  iframe timer sweep, VFS type-collision/rename-sanitize/size-limit/schema hardening,
  and a batch of listener-lifecycle cleanups (window close, controls, drag/resize
  delegation, RagdollUI, EventBus re-entrancy, AudioManager disposer). Each has a
  regression test.
- **Re-audit low-severity regressions**: Settings panel listeners are now tracked and
  removed on re-render/terminate; the Kernel resolves a plugin's trusted iframe id the
  same way on install and uninstall.
- **CI `npm ci` failing on Linux**: The lockfile was missing the Linux native optional
  bindings (`@rolldown/binding-linux-*`), so CI's install step failed on ubuntu even though
  `npm ci` passed on Windows — blocking every job. Fully regenerated the lockfile from a clean
  `npm install` (a partial `--package-lock-only` reconcile was not enough over an already
  incomplete lock).

### Dependencies
- Added `fake-indexeddb` (dev) to test the IndexedDB-backed VFS, and refreshed
  `public/mockServiceWorker.js` to match msw 2.15.0.

## [1.6.5] - 2026-07-14

### Added
- **Settings app**: New Windows-style settings hub launched from the Start Menu (⚙️ Settings), with a category sidebar + content panel designed to host more configuration sections over time. First section is **Language & Region**, a live language switcher that calls `i18n.setLang()`.
- **Localized ragdoll pet speech across 40 languages**: The 2D and 3D ragdoll pets now speak in the selected UI language. Added translation tables for all 40 locales to the `populate-ragdoll-locales.js` generator; universal onomatopoeia (`Zzz`, `Hmm`, `Grr`, `Gulp`, `Pizza?`, `LOL`, …) intentionally fall back to the English defaults. Key parity across all 40 locales is intact.
- **Plugin API sandbox bridge**: Introduced `PluginBridge`, a curated capability surface exposed to third-party plugins so they interact with the Kernel through a controlled API instead of touching internals directly. Wired into `Kernel`, `PluginManager`, and `WindowApp`.

### Changed
- **Live i18n coverage across the static UI**: Desktop icon labels, Start Menu items, sticky notes, and dynamic folder windows (back button, toolbar, address bar) now carry `data-i18n` and relabel in place on language change. `ThemeManager` builds Start Menu labels from `i18n.t()` and re-runs `swapIcons` on the `languagechanged` event. Game README bodies moved out of event listeners into `readme.*` keys.
- **i18n hardening**:
  - `t()` keys are now type-checked at compile time (`TranslationKey` union derived from the English dictionary via `satisfies`), while still accepting dynamic runtime keys.
  - `setLang()` now dispatches a `languagechanged` event so open windows can re-render; the Settings window uses it to update its labels live.
  - Replaced the repetitive `i18n ? i18n.t(k) : 'English fallback'` pattern in Task Manager and Plugin Manager with a direct `i18n` import (single source of truth; the English fallback already lives inside `t()`).
  - Exported the `translations` table and added key-parity tests ensuring every locale defines exactly the same keys with no empty values.
- **Dynamic window creation on-demand**: Migrated static windows and dialogs out of `index.html` (reducing it by ~63%, down to 365 lines). Paint, File Explorer, Internet Explorer, Display Properties, and Ragdoll Workshop now build their windows dynamically on launch via `WindowFactory` and register with the Kernel; My Computer, Recycle Bin, Shutdown, and Debug dialogs are created dynamically inside `SystemBridge`. `EventDelegation` binds dynamically loaded inputs at launch.
- **ResourceManager auto-cleanup integration**: Owner-scoped resource disposal is now wired through the app lifecycle so windows release their `webgl`/`audio`/`listener`/`timer` resources automatically on close.
- **Strict TypeScript migration** completed for the Ragdoll modules, tightening type safety across the pet subsystem.
- **README overhaul**: Added a Live Demo link (itch.io) and an animated hero GIF of the 3D physics ragdoll on the Win95 desktop, captured new screenshots (3D ragdoll pet, sandboxed games arcade), and corrected the dev-server URL to `http://localhost:3000` to match `vite.config`.

### Fixed
- **2D ragdoll language fallback**: The 2D Stickman looked up `window.MessageLibrary`, a global that is never assigned, so its `messageLibrary` was always null and the pet fell back to raw English category names regardless of language. It now resolves `MessageLibrary` via `Services.get()` (mirroring the 3D ragdoll), so speech localizes on language change.
- **3D Ragdoll drop behaviour**: Releasing the desktop 3D ragdoll had two long-standing issues. (1) It slammed to the floor because world gravity was Earth-real `-9.81`, far too strong for the bone scale — lowered to `-5.0` for a natural, weighted fall. (2) It always snapped back to the same spot regardless of where it was dropped: the AI recovery path called `setRagdollMode(false)` without moving the root model, so the mixer re-placed the bones relative to the model origin. Centralized the "reposition root model to the hips' resting X/Z" logic inside `Ragdoll3DCore.setRagdollMode(false)` so every recovery path (AI and fall-reactions) keeps the character where it landed.
- **3D Ragdoll blocked by CSP**: The hardened `script-src 'self'` blocked Rapier3D's WebAssembly instantiation, so the 3D ragdoll failed to start. Added `'wasm-unsafe-eval'` to `script-src` (allows WASM compilation while still blocking `eval()`), and `blob:`/`data:` to `connect-src` so the Three.js `GLTFLoader` can fetch embedded model textures (the model loaded untextured before). Verified: WASM instantiates, blob fetch succeeds, and the ragdoll renders fully textured.

### CI / Testing
- **Stable e2e gate**: Replaced brittle Playwright `toHaveScreenshot()` pixel comparisons (environment-sensitive across local Windows and CI Ubuntu) with functional assertions (boot completes, desktop + Start button visible, Start menu opens) and removed the orphaned win32 baseline images. The e2e job is no longer `continue-on-error` — it is now a real blocking gate.
- **Leak budget tests**: Added `LeakBudget` tests asserting owner-scoped resources are fully released, guarding the `ResourceManager` integration.
- **CI Node bump 20 → 24**: The `package-lock.json` is generated with npm 11 (Node 24), which npm 10 (Node 20) rejected as out-of-sync, failing `npm ci` on every run. Aligned CI to Node 24 to match the dev environment and lockfile.

## [1.6.4] - 2026-07-07

### Added
- **MS-DOS Prompt (Terminal)**: Command-line application backed by the VFS. Supports `help`, `ver`, `cls`/`clear`, `cd`, `dir`/`ls`, `type`/`cat`, `mkdir`, `del`/`rm`, and `ren`, with command history navigation. Auto-registered with the Kernel and launchable from its desktop icon and Start Menu entry.
- **Task Manager**: Live process viewer listing active Kernel processes with end-task support. Refreshes on `kernel:process-started` / `kernel:process-stopped` events plus a 1s poll, organized into Processes / Performance / System tabs.
- **Plugin System**: Runtime app-plugin architecture. `PluginManager.validatePlugin` validates third-party `IAppPlugin` definitions (ID pattern `^[a-z0-9-]+$`, required metadata, component constructor, duplicate-ID guard); the **Plugin Manager** app installs and uninstalls plugins via `Kernel.installPlugin` / `Kernel.uninstallPlugin`.
- **ResourceManager**: Centralized, owner-scoped resource registry (`webgl`, `audio`, `listener`, `timer`) with LIFO disposal, `disposeOwner` / `disposeAll`, and usage `stats()` to standardize leak-free lifecycle cleanup.
- **Themed application icons**: Added `ms-dos.webp` (MS-DOS Prompt) and `task_manager.webp` (Task Manager) for both the Classic Win95 and Modern themes, wired into desktop icons and Start Menu entries via `ThemeManager`.

### Fixed
- **Stability & Security Hardening Sprint (R-01 → R-15)**: Service Worker precaching, memory-leak fixes, sandbox hardening, XSS mitigation, CSP tightening, TouchManager lifecycle cleanup, WebGL context handling, VFS storage quotas, stricter `tsconfig` rules, code hygiene, and a re-entry guard.

## [1.6.2] - 2026-07-03

### Added
- **Chapas Prime 3D Football Game**: Compiled and integrated the Three.js button football game into `public/games/chapas-prime/`. Created its window settings ($1024 \times 600$), VFS files mapping under `C:\GAMES` and `C:\WINDOWS\DESKTOP\GAMES`, and icon actions.
- **Nocturna Rhythm Game**: Integrated the procedural Web Audio rhythm game into `public/games/nocturna/`. Configured its window settings ($900 \times 700$), VFS mapping under `C:\GAMES` and `C:\WINDOWS\DESKTOP\GAMES`, and icon actions.
- **H.I.P. Game Boy Emulator**: Compiled and integrated the 3D WebGL Game Boy emulator into `public/games/hip-gb/`. Configured its window settings ($800 \times 600$), VFS mappings, and icon actions.
- **Recycle Bin Post-it Restoration**: Dragging sticky notes onto the Recycle Bin now hides them, lists them inside the Recycle Bin dialog, and provides a "Restore" button to return them to their original desktop coordinates.
- **System Icon Double-Clicks**: Bounded double-click triggers for both `My Computer` and `Recycle Bin` desktop icons.

## [1.6.1] - 2026-07-03

### Fixed
- **CI pipeline execution**: Fixed package-lock.json out-of-sync error and Vitest configuration --exclude override.
- **Dynamic Window memory leak**: WindowFactory dynamic windows now correctly destroy event listeners and disappear from DOM on close.
- **Controller leaks**: Restored removeEventListener cleanup for keydown, click, and EventBus events on resetState.
- **Ragdoll 2D Audio**: Fixed audioManager window wrapper so legacy 2D pet sounds work under the modularized architecture.
- **RagdollMemory Integration**: Wired RagdollMemory with debounced localStorage writes to both 2D and 3D pet interactions.
- **Double click race condition**: Corrected first click lazy-loading race condition on 3D Ragdoll Toggle.

### Added
- **Accessibility & Keyboard Navigation**: Implemented standard accessibility roles (`role="dialog"`, `role="application"`, and ARIA attributes) for desktop and windows. Added dynamic focus assignment on window opening and focus restoration on window closing.
- **Alt+Tab Window Switcher**: Integrated global keyboard shortcuts (Alt+Tab and Shift+Alt+Tab) to cycle focus and bring active windows to the front based on logical depth.
- **Screen Reader Announcer**: Created a utility `Utils.announce` writing to an `aria-live="assertive"` element for screen readers.
- **BSOD Error Logging**: Integrated automatic logging of unhandled errors to `C:\WINDOWS\SYSTEM\crash.log` in the VFS with automatic log rotation at 50KB.
- **File > New Window in Notepad**: Parameterized `Notepad` constructor (dynamic `windowId` and `textareaId`) and added a menu action to clone the DOM structure and run multiple independent Notepad editor instances.

### Fixed
- **Kernel.launch() Process Deduplication**: Configured option-in app metadata (`singleton: true`) and updated launch handler to prevent duplicate window processes.
- **Memory Leaks**:
  - Unregistered mouse and touch listeners on document in `WindowManager` and `TouchManager` upon window destruction via `destroyWindowInteractions()`.
  - Disposed GLTF geometries/materials/textures and physics debug meshes in `Ragdoll3DCore.terminate()`.
  - Cleared active `standUpTimeout` in `Ragdoll3DCore.terminate()` to prevent callbacks on freed resources.

## [1.6.0] - 2026-07-03

### Added
- **TypeScript strict mode**: Upgraded the codebase to TypeScript strict compilation, eliminating `any` types and adding robust compiler gate check (`tsc --noEmit`).
- **Zero Alloc & Diamond Standard**: Optimized rendering loops and physics cycles to achieve zero memory allocations during runtime.
- **CI pipeline**: Integrated GitHub Actions CI workflow to run linters, type checks, and unit tests on push and pull requests.

## [1.5.59] - 2026-03-08

### Added
- **Initial Commit**: Imported the core Windows 95 simulator structure, virtual file system (VFS), window manager, custom games, and 3D ragdoll simulator.

---

### Reconstructed Historical Milestones (from internal file headers)

These entries represent historical modifications documented in the source code comments before Git tracking began:

#### Notepad Application (Notepad.ts)
- **v5.0**: Added dynamic lifecycle event binding and cleanups registry.
- **v4.0**: Integrated VFS file save/load dialogs.
- **v3.0**: Embedded rich dropdown menu options and edit commands.

#### Service Container (ServiceContainer.ts)
- **v2.0**: Implemented strict typed service registry with full type safety.
- **v1.0**: Initial Dependency Injection setup.

#### EventBus (EventBus.ts)
- **v1.1**: Added once-triggered handler registrations and strict error isolation.

#### Shader Wallpaper (ShaderWallpaper.ts)
- **v2.0**: Multipass shadertoy-compatible render pipelines with ping-pong framebuffers.

---

*Note for Future Contributors: Any change affecting user experience, public APIs, or system configuration must be documented under `[Unreleased]` in the same commit introducing the change.*
