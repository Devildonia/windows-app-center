export interface IAppMetadata {
    name: string;
    icon: string;
    description?: string;
}

export interface IWindowsApp {
    windowId?: string | null;
    terminate?: () => void;
}

export interface IWindowsAppConstructor {
    new (params?: Record<string, any>): IWindowsApp;
}

// Mapeo de claves de Store a sus tipos de valor
export interface IStoreStateMap {
    wallpaper: string;
    taskbarColor: string;
    lang: string;
    bootComplete: boolean;
    screen: string;
    [key: string]: unknown; // Fallback interactivo
}

// Mapeo de nombres de evento a la estructura de su payload
export interface IEventPayloadMap {
    'process-started': any;
    'process-stopped': any;
    'store:changed': [string, any, any]; // tuple: [key, new, old]
    'ragdoll:action': [string, ...any[]]; // [actionType, ...args]
    'ragdoll:toggle': [];
    'ragdoll:state': [boolean]; // [isActive]
    [key: string]: any; // Fallback interactivo universal (cubre dinámica xyz:changed)
}
