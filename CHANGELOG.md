# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
