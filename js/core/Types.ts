export interface IAppMetadata {
    name: string;
    icon: string;
    description?: string;
}

export interface IWindowsApp {
    windowId?: string | null;
    terminate?: () => void;
}

export interface IProcess {
    pid: number;
    appId: string;
    instance: IWindowsApp;
    windowId: string | null;
    status: 'running' | 'terminated';
}

export interface IWindowsAppConstructor {
    new (params?: Record<string, unknown>): IWindowsApp;
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
    'process-started': IProcess;
    'process-stopped': IProcess;
    'store:changed': [string, unknown, unknown]; // tuple: [key, new, old]
    'ragdoll:action': [string, ...unknown[]]; // [actionType, ...args]
    'ragdoll:toggle': [];
    'ragdoll:state': [boolean]; // [isActive]
    'ragdoll3d:toggle': [];
    'ragdoll3d:state': [boolean];
}

export type EventPayload<K extends string> = K extends keyof IEventPayloadMap
    ? IEventPayloadMap[K] extends any[]
        ? IEventPayloadMap[K]
        : [IEventPayloadMap[K]]
    : unknown[];
