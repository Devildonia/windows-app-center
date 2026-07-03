/**
 * WINDOWS 95 APP CENTER - KERNEL
 * Central management for processes, apps, and system events
 * Version: 3.2 (ES Modules)
 *
 * Sprint 2: processes migrated from Array to Map<pid, process>.
 * Terminated processes are removed immediately — no memory accumulation.
 */

import { Utils } from '../utils';
import { VFS } from './VFS';
import { Services } from './ServiceContainer';
import { IWindowsApp, IAppMetadata, IWindowsAppConstructor, IProcess } from './Types';

export interface IAppRegistryEntry {
    appClass: IWindowsAppConstructor;
    metadata: IAppMetadata;
}

export interface IKernelRegistry {
    apps: Record<string, IAppRegistryEntry>;
    processes: Map<number, IProcess>;
}

export interface IKernel {
    init(): void;
    registerApp(id: string, appClass: IWindowsAppConstructor, metadata: IAppMetadata): void;
    launch(appId: string, params?: Record<string, unknown>): IProcess | null;
    kill(pid: number): boolean;
    getRegistry(): { apps: Record<string, IAppRegistryEntry>, processes: IProcess[] };
    getProcess(pid: number): IProcess | undefined;
    getActiveCount(): number;
    __reset(): void;
}

export const Kernel: IKernel = (() => {
    'use strict';

    const registry: IKernelRegistry = {
        apps: {},
        processes: new Map<number, IProcess>() // Map<pid, process> — replaces array, auto-cleans on kill
    };

    let _nextPid = 0;          // Monotonically increasing PID counter

    /**
     * Registers a new application class to the system
     */
    function registerApp(id: string, appClass: IWindowsAppConstructor, metadata: IAppMetadata): void {
        registry.apps[id] = { appClass, metadata };
        Utils.Logger.log(`Kernel: App registered [${id}]`);
    }

    function launch(appId: string, params: Record<string, unknown> = {}): IProcess | null {
        const appInfo = registry.apps[appId];
        if (!appInfo) {
            Utils.Logger.error(`Kernel: App not found [${appId}]`);
            return null;
        }

        Utils.Logger.log(`Kernel: Launching ${appId}...`);
        
        // Prevent launching duplicate instances of singleton apps
        if (appInfo.metadata?.singleton === true) {
            const existingProcess = Array.from(registry.processes.values()).find(
                p => p.appId === appId && p.status === 'running'
            );

            if (existingProcess) {
                Utils.Logger.log(`Kernel: App ${appId} is already running (singleton). Focusing window ${existingProcess.windowId}`);
                if (existingProcess.windowId) {
                    const wm: any = Services.get('WindowManager');
                    if (wm) {
                        wm.open(existingProcess.windowId);
                        const win = Utils.getElement(existingProcess.windowId) as HTMLElement | null;
                        if (win) wm.bringToFront(win);
                    }
                }
                return existingProcess;
            }
        }

        try {
            const instance = new appInfo.appClass(params);
            const pid = _nextPid++;

            const process: IProcess = {
                pid,
                appId,
                instance,
                windowId: instance.windowId || null,
                status: 'running'
            };

            registry.processes.set(pid, process);

            // Auto-open window (Fixed: ensuring foreground launch)
            if (process.windowId) {
                const wm: any = Services.get('WindowManager');
                if (wm) wm.open(process.windowId);
            }

            // Dispatch event for Taskbar
            window.dispatchEvent(new CustomEvent('kernel:process-started', { detail: process }));

            Utils.Logger.log(`Kernel: PID ${pid} started (${registry.processes.size} active processes)`);
            return process;
        } catch (e) {
            Utils.Logger.error(`Kernel: Failed to launch ${appId}`, e);
            return null;
        }
    }

    /**
     * Terminates a process and removes it from the process table.
     * No memory accumulation: killed processes are fully deleted.
     */
    function kill(pid: number): boolean {
        const process = registry.processes.get(pid);
        if (!process) return false;

        process.status = 'terminated';
        if (process.instance && typeof process.instance.terminate === 'function') {
            process.instance.terminate();
        }

        window.dispatchEvent(new CustomEvent('kernel:process-stopped', { detail: process }));

        // Remove from Map — no lingering references
        registry.processes.delete(pid);
        Utils.Logger.log(`Kernel: PID ${pid} killed (${registry.processes.size} active processes)`);
        return true;
    }

    function init(): void {
        Utils.Logger.log('Kernel: Booting...');
        VFS.init();
        Utils.Logger.log('Kernel: Ready');
    }

    /**
     * Returns a snapshot of the registry for inspection.
     * processes is exposed as an iterable array for external consumers.
     */
    function getRegistry(): { apps: Record<string, IAppRegistryEntry>, processes: IProcess[] } {
        return {
            apps: registry.apps,
            processes: Array.from(registry.processes.values())  // array snapshot, not the live Map
        };
    }

    return {
        init,
        registerApp,
        launch,
        kill,
        getRegistry,
        getProcess: (pid: number) => registry.processes.get(pid),
        getActiveCount: () => registry.processes.size,
        __reset: () => {
            registry.apps = {};
            registry.processes.clear();
            _nextPid = 0;
        }
    };
})();

// Legacy global binding
if (typeof window !== 'undefined') {
    window.Kernel = Kernel;
    Services.register('Kernel', Kernel);
}
