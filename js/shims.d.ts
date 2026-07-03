declare module '*/RagdollPet.js' {
    export const RagdollPet: any;
}
declare module '*/Stickman.js' {
    export const Stickman: any;
}
declare module '*/Particles.js' {
    export const BloodParticle: any;
    export const ZzzParticle: any;
    export const TearParticle: any;
}

interface Window {
    // Project services/singletons
    Kernel: any;
    VFS: any;
    Services: any;
    Utils: any;
    WindowManager: any;
    WindowFactory: any;
    TaskbarManager: any;
    DesktopManager: any;
    ShaderWallpaper: any;
    TouchManager: any;
    HDRManager: any;
    EventBus: any;
    Store: any;
    AudioManager: any;
    BubbleAnimator: any;
    MessageLibrary: any;
    RagdollMemory: any;
    Ragdoll3DViewer: any;
    BootLoader: any;
    themeManager: any;
    ragdollPet: any;
    Notify: any;
    i18n: any;

    // OS global bridging
    state: any;
    familyData: any;
    playBlip: any;
    openWindow: any;
    closeWindow: any;
    openDialog: any;
    closeDialog: any;
    navigateIE: any;
    handleShutdown: any;
    initOS: any;
    setupEventListeners: any;
    initializeWindowControls: any;
    initializeDraggableIcons: any;
    setWallpaper: any;
    setTaskbarColor: any;
    handleWallpaperUpload: any;
    _createStateBridge: any;

    // Third-party
    Webamp: any;
    Matter: any;
    webkitAudioContext: any;
}
