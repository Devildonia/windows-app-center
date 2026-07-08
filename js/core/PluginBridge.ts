import { Kernel } from './Kernel.js';
import { WindowManager } from '../ui/WindowManager.js';
import { VFS } from './VFS.js';
import { Utils } from '../utils.js';

export const PluginBridge = {
    init(): void {
        window.addEventListener('message', (event: MessageEvent) => {
            // Sandboxed iframe origins are "null", so we validate structural safety.
            const data = event.data;
            if (!data || typeof data !== 'object') return;

            const { type, payload } = data;
            if (typeof type !== 'string' || !type.startsWith('plugin:')) return;

            Utils.Logger.log(`[PluginBridge] Message received: ${type}`, payload);

            try {
                switch (type) {
                    case 'plugin:close-window':
                        if (payload && typeof payload.windowId === 'string') {
                            WindowManager.close(payload.windowId);
                        }
                        break;
                    case 'plugin:launch-app':
                        if (payload && typeof payload.appId === 'string') {
                            Kernel.launch(payload.appId, payload.params || {});
                        }
                        break;
                    case 'plugin:vfs-write':
                        if (payload && typeof payload.path === 'string' && typeof payload.name === 'string' && typeof payload.content === 'string') {
                            VFS.writeFile(payload.path, payload.name, payload.content);
                            VFS.flushSync();
                        }
                        break;
                    case 'plugin:log':
                        if (payload && typeof payload.message === 'string') {
                            Utils.Logger.log(`[PluginLog] ${payload.message}`);
                        }
                        break;
                    default:
                        Utils.Logger.warn(`[PluginBridge] Unknown message type: ${type}`);
                }
            } catch (err) {
                Utils.Logger.error(`[PluginBridge] Error handling message ${type}:`, err);
            }
        });
        Utils.Logger.log('[PluginBridge] Sandbox message bridge initialized.');
    }
};
