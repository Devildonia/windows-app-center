# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Settings app**: New Windows-style settings hub launched from the Start Menu (⚙️ Settings), with a category sidebar + content panel designed to host more configuration sections over time. First section is **Language & Region**, a live language switcher that calls `i18n.setLang()`.

### Changed
- **i18n hardening**:
  - `t()` keys are now type-checked at compile time (`TranslationKey` union derived from the English dictionary via `satisfies`), while still accepting dynamic runtime keys.
  - `setLang()` now dispatches a `languagechanged` event so open windows can re-render; the Settings window uses it to update its labels live.
  - Replaced the repetitive `i18n ? i18n.t(k) : 'English fallback'` pattern in Task Manager and Plugin Manager with a direct `i18n` import (single source of truth; the English fallback already lives inside `t()`).
  - Exported the `translations` table and added key-parity tests ensuring every locale defines exactly the same keys with no empty values.

### Fixed
- **3D Ragdoll blocked by CSP**: The hardened `script-src 'self'` blocked Rapier3D's WebAssembly instantiation, so the 3D ragdoll failed to start. Added `'wasm-unsafe-eval'` to `script-src` (allows WASM compilation while still blocking `eval()`), and `blob:`/`data:` to `connect-src` so the Three.js `GLTFLoader` can fetch embedded model textures (the model loaded untextured before). Verified: WASM instantiates, blob fetch succeeds, and the ragdoll renders fully textured.

## [1.6.3] - 2026-07-07

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
