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
    Services: any;
    Utils: any;
    themeManager: any;
    ragdollPet: any;

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
