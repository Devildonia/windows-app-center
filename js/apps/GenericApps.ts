/**
 * WINDOWS 95 APP CENTER - GENERIC WINDOW APP
 * Wrapper for simple window-based apps
 */
import { Kernel } from '../core/Kernel';
import { Ragdoll3DViewer } from './Ragdoll3DViewer';

export interface IGenericAppParams {
    windowId: string;
}

class GenericWindowApp {
    public windowId: string;

    constructor(params: IGenericAppParams) {
        this.windowId = params.windowId;
        // No init logic needed, Kernel opens the window
    }
}

// Register generic windows
Kernel.registerApp('games-folder', class extends GenericWindowApp {
    constructor() { super({ windowId: 'win-games-folder' }); }
}, { name: 'Games', icon: '📂' });

Kernel.registerApp('display-props', class extends GenericWindowApp {
    constructor() { super({ windowId: 'win-display-props' }); }
}, { name: 'Display Properties', icon: 'assets/icons/Display.webp' });

Kernel.registerApp('ragdoll-skins', class extends GenericWindowApp {
    private static viewerInitialized = false;
    constructor() { 
        super({ windowId: 'win-ragdoll-skins' }); 
        if (!(this.constructor as any).viewerInitialized) {
            new Ragdoll3DViewer();
            (this.constructor as any).viewerInitialized = true;
        }
    }
}, { name: 'Ragdoll Workshop', icon: 'assets/icons/ragdoll_skins.webp' });
