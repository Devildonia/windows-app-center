import { CONFIG } from '../config';
import { Utils } from '../utils';
import { Services } from '../core/ServiceContainer';
import { IAppMetadata, IProcess } from '../core/Types';

type ILegacyProcess = {
    pid: string;
    appId: string;
    windowId: string;
    status: 'running';
    isLegacy: true;
    metadata: { icon: string; name: string };
};

export interface IWindowManager {
    open(windowId: string): void;
    close(windowId: string): void;
    minimize(windowId: string): void;
    maximize(windowId: string): void;
    bringToFront(win: HTMLElement | null): void;
    makeDraggable(windowId: string): void;
    destroyDraggable(windowId: string): void;
    initializeControls(): void;
    destroy(): void;
    getActive(): string[];
    closeAll(): void;
}

const WindowManager: IWindowManager = (function () {
    'use strict';

    // Private state
    //
    // v2.0 — z-index lógico:
    // En lugar de incrementar un contador absoluto y hacer "reset visible",
    // mantenemos un Map<windowId, logicalOrder> donde el order es simplemente
    // la posición de la ventana en la pila. El z-index real se calcula en el
    // momento de aplicar: Z_INDEX_BASE + order * Z_INDEX_INCREMENT.
    // El reset nunca es necesario — la reordenación es instantánea e invisible.
    //
    let _windowOrder: Map<string, number> = new Map(); // windowId → posición en pila
    let _orderCounter: number = 0;                     // monótono creciente, nunca se resetea
    let activeWindows = new Set<string>();
    let _initialized = false;
    let onDocumentClick: ((e: Event) => void) | null = null;

    const _dragRegistry = new Map<string, {
        header: HTMLElement;
        mousedown: EventListener;
        mousemove: EventListener;
        mouseup: EventListener;
    }>();

    /** Calcula el z-index real de una ventana dado su logical order */
    function _zIndexFor(order: number): number {
        return CONFIG.WINDOWS.Z_INDEX_BASE + (order * CONFIG.WINDOWS.Z_INDEX_INCREMENT);
    }

    /**
     * Opens a window by ID
     * @param {string} windowId - Window element ID
     */
    function openWindow(windowId: string): void {
        const win = Utils.getElement(windowId) as HTMLElement | null;
        if (!win) {
            Utils.Logger.error(`Window not found: ${windowId}`);
            return;
        }

        Utils.Logger.window(`Opening window: ${windowId}`);

        // Modern UI Open Sound Logic
        const tm: any = Services.get('ThemeManager');
        const isModernTheme = tm?.currentTheme === 'modern';
        if (isModernTheme) {
            const audio: any = Services.get('AudioManager');
            if (audio) {
                audio.play('open_window_modern', { volume: 0.7 });
            }
        }

        _restoreIframes(win, windowId);
        _showWindow(win, windowId);
        _registerLegacyProcess(win, windowId);
    }

    /**
     * Restore iframe sources if they were unloaded (process restoration)
     * @private
     */
    function _restoreIframes(win: HTMLElement, windowId: string): void {
        const iframes = win.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const savedSrc = iframe.getAttribute('data-src');
            const isBlank = !iframe.src || iframe.src === 'about:blank' || iframe.src.startsWith('about:blank');

            if (savedSrc && isBlank) {
                iframe.src = savedSrc;
                Utils.Logger.window(`Restored process in ${windowId}`);
            } else if (!savedSrc && !isBlank) {
                iframe.setAttribute('data-src', iframe.src);
            }
        });
    }

    /**
     * Make window visible and manage z-index
     * @private
     */
    function _showWindow(win: HTMLElement, windowId: string): void {
        if (win.classList.contains('win95-window')) {
            win.style.display = 'flex';
            
            // Start open animation
            win.classList.remove('window-closing');
            win.classList.add('window-opening');
            
            const onAnimationEnd = () => {
                win.classList.remove('window-opening');
                win.removeEventListener('animationend', onAnimationEnd);
            };
            win.addEventListener('animationend', onAnimationEnd);
        } else {
            win.style.display = 'block';
        }
        win.style.zIndex = _zIndexFor(++_orderCounter).toString();
        _windowOrder.set(windowId, _orderCounter);
        activeWindows.add(windowId);

        // Move focus to first interactive element or the window itself
        const interactive = win.querySelector('[tabindex]:not([tabindex="-1"]), button:not(.window-btn), input, textarea, select') as HTMLElement | null;
        if (interactive) {
            interactive.focus();
        } else {
            win.setAttribute('tabindex', '-1');
            win.focus();
        }
    }

    /**
     * Register a synthetic process for windows not launched via Kernel
     * @private
     */
    function _registerLegacyProcess(win: HTMLElement, windowId: string): void {
        const kernel: any = Services.get('Kernel');
        if (!kernel) return;

        const registry = kernel.getRegistry();
        const existingProcess = registry.processes.find((p: any) => p.windowId === windowId && p.status === 'running');
        if (existingProcess) return;

        const header = win.querySelector('.window-header span');
        let title = header ? header.textContent || windowId : windowId;

        // Clean title for matching
        const cleanTitle = title
            .replace(/\s*\-\s*(Notepad|Paint|Internet Explorer|Windows Explorer)/i, '')
            .replace(/The Internet/i, 'Internet Explorer')
            .replace(/Ragdoll Workshop & Skins/i, 'Ragdoll Workshop')
            .trim();

        // Try to find the app in registry by name/title
        let appId = windowId;
        let metadata: IAppMetadata = { icon: '📄', name: title };

        // Match against catalog
        const appEntry = (Object.entries(registry.apps) as [string, { metadata: IAppMetadata }][]).find(([id, info]) => {
            return id === windowId || info.metadata.name === cleanTitle || info.metadata.name === title;
        });

        if (appEntry) {
            appId = appEntry[0];
            metadata = appEntry[1].metadata;
        } else {
            // Manual fallback mapping for known window IDs
            const iconMap: [RegExp, string][] = [
                [/vlrs/i, 'assets/icons/vlrs_icon.webp'],
                [/neon|flappy/i, 'assets/icons/neon.webp'],
                [/rush|football/i, 'assets/icons/rush.webp'],
                [/doom/i, 'assets/icons/doom.webp'],
                [/display|settings/i, 'assets/icons/Display.webp'],
                [/internet|ie/i, 'assets/icons/iexplorer.webp'],
                [/media|amp/i, 'assets/icons/winamp_icon.webp'],
                [/ragdoll|workshop|skin/i, 'assets/icons/ragdoll_skins.webp'],
                [/paint/i, '🎨'],
                [/notepad/i, '📝'],
                [/folder|explorer/i, '📂']
            ];
            metadata.icon = (iconMap.find(([re]) => re.test(windowId) || re.test(cleanTitle)) || [null, '📄'])[1] as string;
            metadata.name = cleanTitle;
        }

        const fakeProcess: ILegacyProcess = {
            pid: `legacy-${windowId}`,
            appId: appId,
            windowId: windowId,
            status: 'running',
            isLegacy: true,
            metadata: metadata
        };

        // Safety: Check if taskbar already has a button for this window
        const existingBtn = document.getElementById(`task-btn-legacy-${windowId}`);
        if (!existingBtn) {
            window.dispatchEvent(new CustomEvent('kernel:process-started', { detail: fakeProcess as unknown as IProcess }));
        }
    }

    /**
     * Terminates an iframe completely — stops execution, clears intervals/rAFs, unloads
     * @param {HTMLIFrameElement} iframe - Iframe to terminate
     * @param {string} context - Window ID for logging
     * @private
     */
    function terminateIframe(iframe: HTMLIFrameElement, context: string): void {
        try {
            const iframeWindow = iframe.contentWindow as any;
            if (iframeWindow) {
                // Stop all network requests and parsing
                iframeWindow.stop();

                // Cancel any pending animation frames (brute-force up to 100k IDs)
                const highestId = iframeWindow.requestAnimationFrame?.(() => { });
                if (highestId) {
                    for (let i = 0; i <= highestId; i++) {
                        iframeWindow.cancelAnimationFrame(i);
                    }
                }

                // Clear all intervals and timeouts (brute-force)
                const highestTimeout = iframeWindow.setTimeout?.(() => { }, 0);
                if (highestTimeout) {
                    for (let i = 0; i <= highestTimeout; i++) {
                        iframeWindow.clearTimeout(i);
                        iframeWindow.clearInterval(i);
                    }
                }

                // Close any AudioContext
                if (iframeWindow.AudioContext || iframeWindow.webkitAudioContext) {
                    try {
                        // Games may store their context differently
                        const audioCtx = iframeWindow._audioContext || iframeWindow.audioContext;
                        if (audioCtx && audioCtx.state !== 'closed') {
                            audioCtx.close();
                        }
                    } catch (e) { /* ignore */ }
                }
            }
        } catch (e) {
            // Cross-origin iframe — cannot access contentWindow, just unload
            Utils.Logger.window(`Cross-origin iframe in ${context}, unloading directly`);
        }

        // Save src for potential restoration and unload
        if (iframe.src && iframe.src !== 'about:blank' && !iframe.src.startsWith('about:blank')) {
            iframe.setAttribute('data-src', iframe.src);
        }
        iframe.src = 'about:blank';
        Utils.Logger.window(`Terminated process in ${context}`);
    }

    /**
     * Closes a window by ID
     * @param {string} windowId - Window element ID
     */
    function closeWindow(windowId: string): void {
        const win = Utils.getElement(windowId) as HTMLElement | null;
        if (!win) return;

        // Restore focus before window is hidden/closed
        const activeEl = document.activeElement;
        if (activeEl && win.contains(activeEl)) {
            let fallbackFocusTarget: HTMLElement | null = null;
            const appId = windowId.replace('win-', '');
            if (appId) {
                fallbackFocusTarget = document.querySelector(`.icon[data-launch="${appId}"]`) as HTMLElement | null;
            }
            if (!fallbackFocusTarget) {
                fallbackFocusTarget = document.getElementById('desktop');
            }
            if (!fallbackFocusTarget) {
                fallbackFocusTarget = document.body;
            }
            if (fallbackFocusTarget) {
                fallbackFocusTarget.focus();
            }
        }

        Utils.Logger.window(`Closing window: ${windowId}`);

        // Modern UI Close Sound Logic
        const tm: any = Services.get('ThemeManager');
        const isModernTheme = tm?.currentTheme === 'modern';
        if (isModernTheme) {
            const audio: any = Services.get('AudioManager');
            if (audio) {
                audio.play('close_window_modern', { volume: 0.7 });
            }
        }

        // PROCESS TERMINATION: Fully terminate iframes (stop rAF, intervals, audio)
        const iframes = win.querySelectorAll('iframe');
        iframes.forEach(iframe => terminateIframe(iframe, windowId));

        if (win.classList.contains('win95-window')) {
            win.classList.remove('window-opening');
            win.classList.add('window-closing');

            const finalizeClose = () => {
                win.classList.remove('window-closing');
                win.style.display = 'none';
                activeWindows.delete(windowId);
                _windowOrder.delete(windowId);
                _notifyKernelProcessKilled(windowId);
                win.removeEventListener('animationend', finalizeClose);
            };

            // Bypass in testing environment (jsdom does not fire CSS animations automatically)
            if (process.env.NODE_ENV === 'test' || typeof window.navigator === 'undefined' || window.navigator.userAgent.includes('jsdom')) {
                finalizeClose();
            } else {
                win.addEventListener('animationend', finalizeClose);
            }
        } else {
            win.style.display = 'none';
            activeWindows.delete(windowId);
            _windowOrder.delete(windowId);
            _notifyKernelProcessKilled(windowId);
        }
    }

    /**
     * Helper factorizado para notificar al Kernel cuando muere una app
     */
    function _notifyKernelProcessKilled(windowId: string): void {
        // v3.0 Process Integration: Notify Kernel to kill process
        const kernel: any = Services.get('Kernel');
        if (kernel) {
            const processes = kernel.getRegistry().processes;
            const proc = processes.find((p: any) => p.windowId === windowId && p.status === 'running');
            if (proc) {
                kernel.kill(proc.pid);
            } else {
                // Check for our legacy fake process
                window.dispatchEvent(new CustomEvent('kernel:process-stopped', {
                    detail: { pid: `legacy-${windowId}`, windowId: windowId } as unknown as IProcess
                }));
            }
        }
    }

    /**
     * Brings window to front
     * @param {HTMLElement | null} win - Window element
     */
    function bringToFront(win: HTMLElement | null): void {
        if (!win) return;
        const order = ++_orderCounter;
        if (win.id) _windowOrder.set(win.id, order);
        win.style.zIndex = _zIndexFor(order).toString();
    }

    /**
     * Reordena las ventanas activas manteniendo su orden relativo pero
     * compactando los valores absolutos. Operación instantánea e invisible.
     * Ya no es necesaria para prevenir overflow — sólo se expone para debug.
     * @private
     */
    function resetZIndices(): void {
        Utils.Logger.window('Compacting z-index order (logical reset)');

        // Ordenar ventanas por su logical order actual
        const sorted = Array.from(_windowOrder.entries())
            .sort(([, a], [, b]) => a - b);

        // Reasignar orders compactos y aplicar al DOM
        let newOrder = 1;
        const newMap = new Map<string, number>();
        sorted.forEach(([id]) => {
            const win = Utils.getElement(id) as HTMLElement | null;
            if (win && activeWindows.has(id)) {
                newMap.set(id, newOrder);
                win.style.zIndex = _zIndexFor(newOrder).toString();
                newOrder++;
            }
        });

        _windowOrder = newMap;
        _orderCounter = newOrder;
    }

    function destroyDraggable(windowId: string): void {
        const entry = _dragRegistry.get(windowId);
        if (entry) {
            Utils.eventManager.remove(entry.header, 'mousedown', entry.mousedown);
            Utils.eventManager.remove(document, 'mousemove', entry.mousemove);
            Utils.eventManager.remove(document, 'mouseup', entry.mouseup);
            _dragRegistry.delete(windowId);
        }

        // Also clean up touch dragging if touch manager is active
        const tm: any = Services.get('TouchManager');
        if (tm && typeof tm.destroyDraggable === 'function') {
            tm.destroyDraggable(windowId);
        }
    }

    /**
     * Makes a window draggable by its header
     * @param {string} windowId - Window element ID
     */
    function makeDraggable(windowId: string): void {
        const win = Utils.getElement(windowId) as HTMLElement | null;
        if (!win) return;

        const header = win.querySelector('.window-header') as HTMLElement | null;
        if (!header) {
            Utils.Logger.warn(`No header found for window: ${windowId}`);
            return;
        }

        // Clean up previous draggable listeners if any
        destroyDraggable(windowId);

        let isDragging = false;
        let startX: number, startY: number, initialX: number, initialY: number;

        const onMouseDown = (e: Event): void => {
            const mouseEvt = e as MouseEvent;
            // Ignore if clicking on buttons
            if ((mouseEvt.target as HTMLElement).classList.contains('window-btn')) return;

            isDragging = true;
            startX = mouseEvt.clientX;
            startY = mouseEvt.clientY;

            // Get current position
            const rect = win.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;

            // Bring to front
            bringToFront(win);

            // Prevent text selection
            mouseEvt.preventDefault();
        };

        const onMouseMove = (e: Event): void => {
            const mouseEvt = e as MouseEvent;
            if (!isDragging) return;

            const deltaX = mouseEvt.clientX - startX;
            const deltaY = mouseEvt.clientY - startY;

            win.style.left = (initialX + deltaX) + 'px';
            win.style.top = (initialY + deltaY) + 'px';
            win.style.transform = 'none'; // Remove centering transform
        };

        const onMouseUp = (): void => {
            isDragging = false;
        };

        // Register events with EventManager
        Utils.eventManager.add(header, 'mousedown', onMouseDown);
        Utils.eventManager.add(document, 'mousemove', onMouseMove);
        Utils.eventManager.add(document, 'mouseup', onMouseUp);

        // Store references for clean removal
        _dragRegistry.set(windowId, {
            header,
            mousedown: onMouseDown,
            mousemove: onMouseMove,
            mouseup: onMouseUp
        });

        Utils.Logger.window(`Window ${windowId} is now draggable`);
    }

    /**
     * Makes a window resizable
     * @param {string} windowId - Window element ID
     */
    function makeResizable(windowId: string): void {
        const win = Utils.getElement(windowId) as HTMLElement | null;
        if (!win) return;

        // Add resize handle if it doesn't exist
        let resizeHandle = win.querySelector('.window-resize-handle') as HTMLElement | null;
        if (!resizeHandle) {
            resizeHandle = document.createElement('div');
            resizeHandle.className = 'window-resize-handle';
            win.appendChild(resizeHandle);
        }

        let isResizing = false;
        let startX: number, startY: number, startWidth: number, startHeight: number;

        const onMouseDown = (e: Event): void => {
            const mouseEvt = e as MouseEvent;
            isResizing = true;
            startX = mouseEvt.clientX;
            startY = mouseEvt.clientY;

            const rect = win.getBoundingClientRect();
            startWidth = rect.width;
            startHeight = rect.height;

            // Bring to front
            bringToFront(win);

            mouseEvt.preventDefault();
            mouseEvt.stopPropagation();
        };

        const onMouseMove = (e: Event): void => {
            const mouseEvt = e as MouseEvent;
            if (!isResizing) return;

            const deltaX = mouseEvt.clientX - startX;
            const deltaY = mouseEvt.clientY - startY;

            const newWidth = Math.max(200, startWidth + deltaX);
            const newHeight = Math.max(150, startHeight + deltaY);

            win.style.width = newWidth + 'px';
            win.style.height = newHeight + 'px';
        };

        const onMouseUp = (): void => {
            isResizing = false;
        };

        // Register events
        Utils.eventManager.add(resizeHandle, 'mousedown', onMouseDown);
        Utils.eventManager.add(document, 'mousemove', onMouseMove);
        Utils.eventManager.add(document, 'mouseup', onMouseUp);

        Utils.Logger.window(`Window ${windowId} is now resizable`);
    }

    /**
     * Toggles window maximized state
     * @param {string} windowId - Window element ID
     */
    function toggleMaximize(windowId: string): void {
        const win = Utils.getElement(windowId) as HTMLElement | null;
        if (!win) return;

        const isMaximized = win.classList.contains('maximized');

        if (isMaximized) {
            win.classList.remove('maximized');
            Utils.Logger.window(`Window ${windowId} restored`);
        } else {
            win.classList.add('maximized');
            Utils.Logger.window(`Window ${windowId} maximized`);
        }
    }

    /**
     * Minimizes window (hides it)
     * @param {string} windowId - Window element ID
     */
    function minimizeWindow(windowId: string): void {
        const win = Utils.getElement(windowId) as HTMLElement | null;
        if (!win) return;

        Utils.Logger.window(`Window ${windowId} minimized`);
        win.style.display = 'none';
        // We don't remove it from activeWindows so the taskbar button stays
    }

    /**
     * Initializes window controls (Now using Event Delegation)
     */
    function initializeWindowControls(): void {
        // Guard: prevent multiple initializations (was being called 3x)
        if (_initialized) {
            Utils.Logger.window('Window controls already initialized, skipping.');
            return;
        }
        _initialized = true;

        Utils.Logger.window('Initializing window controls (Event Delegation)...');

        const windows = document.querySelectorAll('.win95-window');

        windows.forEach(node => {
            const win = node as HTMLElement;
            const windowId = win.id;
            if (!windowId) return;

            // Make sure role and aria-labelledby are present (Semantics of windows)
            if (!win.getAttribute('role')) {
                win.setAttribute('role', 'dialog');
            }
            if (!win.getAttribute('aria-labelledby')) {
                const header = win.querySelector('.window-header');
                if (header) {
                    const titleSpan = header.querySelector('span:not(.window-btn)');
                    if (titleSpan) {
                        if (!titleSpan.id) titleSpan.id = `${windowId}-title`;
                        win.setAttribute('aria-labelledby', titleSpan.id);
                    }
                }
            }
            // Ensure control buttons have aria-label
            const minBtn = win.querySelector('.minimize-btn');
            if (minBtn && !minBtn.getAttribute('aria-label')) minBtn.setAttribute('aria-label', 'Minimize');
            const maxBtn = win.querySelector('.maximize-btn');
            if (maxBtn && !maxBtn.getAttribute('aria-label')) maxBtn.setAttribute('aria-label', 'Maximize');
            const closeBtn = win.querySelector('.close-btn');
            if (closeBtn && !closeBtn.getAttribute('aria-label')) closeBtn.setAttribute('aria-label', 'Close');

            // Make draggable
            makeDraggable(windowId);

            // Make resizable
            makeResizable(windowId);

            // Bring to front on click
            Utils.eventManager.add(win, 'mousedown', ((e: Event) => bringToFront(win)) as EventListener);
        });

        onDocumentClick = (e: Event): void => {
            const target = e.target as HTMLElement;

            // Check if clicked element is a window button (or inside one)
            const btn = target.closest('.window-btn') as HTMLElement | null;
            if (!btn) {
                // Check if it was a window header to bring to front
                const winHeader = target.closest('.window-header') as HTMLElement | null;
                if (winHeader) {
                    const win = winHeader.closest('.win95-window') as HTMLElement | null;
                    if (win) bringToFront(win);
                }
                return;
            }

            // Find which window this button belongs to
            const win = btn.closest('.win95-window') as HTMLElement | null;
            if (!win) {
                Utils.Logger.error('[WindowManager] Button clicked but no parent window found!');
                return;
            }

            const windowId = win.id;
            Utils.Logger.window(`Action on ${windowId}:`, btn.className);

            if (btn.classList.contains('minimize-btn')) {
                minimizeWindow(windowId);
            } else if (btn.classList.contains('maximize-btn')) {
                toggleMaximize(windowId);
            } else if (btn.classList.contains('close-btn')) {
                closeWindow(windowId);
            }
        };

        document.addEventListener('click', onDocumentClick);

        Utils.Logger.window(`Initialized controls for ${windows.length} existing windows`);
    }

    function destroyWindowControls(): void {
        if (onDocumentClick) {
            document.removeEventListener('click', onDocumentClick);
            onDocumentClick = null;
        }
        _initialized = false;
    }

    /**
     * Gets list of active windows
     * @returns {Array<string>} Array of window IDs
     */
    function getActiveWindows(): string[] {
        return Array.from(activeWindows);
    }

    /**
     * Closes all windows
     */
    function closeAllWindows(): void {
        Utils.Logger.window('Closing all windows');
        activeWindows.forEach(windowId => closeWindow(windowId));
    }

    // Public API
    return {
        open: openWindow,
        close: closeWindow,
        minimize: minimizeWindow,
        maximize: toggleMaximize,
        bringToFront,
        makeDraggable,
        destroyDraggable,
        initializeControls: initializeWindowControls,
        destroy: destroyWindowControls,
        getActive: getActiveWindows,
        closeAll: closeAllWindows
    };
})();

// Make globally available
export { WindowManager };

if (typeof window !== 'undefined') {
    (window as any).WindowManager = WindowManager;
    Services.register('WindowManager', WindowManager);
}
