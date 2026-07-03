import { Utils } from '../utils';
import { Services } from '../core/ServiceContainer';

// ============================================
// WINDOW INTERACTIONS
// Arrastre (por la cabecera) y redimensionado (por el handle) de ventanas.
// Extraído de WindowManager. Registra y limpia los listeners de mouse por
// ventana. Recibe `bringToFront` como dependencia para elevar la ventana al
// interactuar sin acoplarse al z-stack.
// ============================================

interface IInteractionEntry {
    triggerElement: HTMLElement;
    mousedown: EventListener;
    mousemove: EventListener;
    mouseup: EventListener;
}

export class WindowInteractions {
    private readonly _dragRegistry = new Map<string, IInteractionEntry>();
    private readonly _resizeRegistry = new Map<string, IInteractionEntry>();

    constructor(private readonly bringToFront: (win: HTMLElement) => void) {}

    private bind(
        windowId: string,
        triggerElement: HTMLElement,
        registry: Map<string, IInteractionEntry>,
        onMouseDown: (e: MouseEvent) => boolean | void,
        onMouseMove: (e: MouseEvent) => void,
        onMouseUp: () => void
    ): void {
        let active = false;

        const mousedown = (e: Event): void => {
            const mouseEvt = e as MouseEvent;
            const proceed = onMouseDown(mouseEvt);
            if (proceed === false) return;
            active = true;
        };

        const mousemove = (e: Event): void => {
            if (!active) return;
            onMouseMove(e as MouseEvent);
        };

        const mouseup = (): void => {
            if (!active) return;
            active = false;
            onMouseUp();
        };

        Utils.eventManager.add(triggerElement, 'mousedown', mousedown);
        Utils.eventManager.add(document, 'mousemove', mousemove);
        Utils.eventManager.add(document, 'mouseup', mouseup);

        registry.set(windowId, { triggerElement, mousedown, mousemove, mouseup });
    }

    private unbind(windowId: string, registry: Map<string, IInteractionEntry>): void {
        const entry = registry.get(windowId);
        if (entry) {
            Utils.eventManager.remove(entry.triggerElement, 'mousedown', entry.mousedown);
            Utils.eventManager.remove(document, 'mousemove', entry.mousemove);
            Utils.eventManager.remove(document, 'mouseup', entry.mouseup);
            registry.delete(windowId);
        }
    }

    public destroyDraggable(windowId: string): void {
        this.unbind(windowId, this._dragRegistry);

        // Also clean up touch dragging if touch manager is active
        const tm: any = Services.get('TouchManager');
        if (tm && typeof tm.destroyDraggable === 'function') {
            tm.destroyDraggable(windowId);
        }
    }

    public destroyResizable(windowId: string): void {
        this.unbind(windowId, this._resizeRegistry);
    }

    public destroyWindowInteractions(windowId: string): void {
        this.destroyDraggable(windowId);
        this.destroyResizable(windowId);
    }

    /** Makes a window draggable by its header */
    public makeDraggable(windowId: string): void {
        const win = Utils.getElement(windowId) as HTMLElement | null;
        if (!win) return;

        const header = win.querySelector('.window-header') as HTMLElement | null;
        if (!header) {
            Utils.Logger.warn(`No header found for window: ${windowId}`);
            return;
        }

        // Clean up previous draggable listeners if any
        this.destroyDraggable(windowId);

        let isDragging = false;
        let startX: number, startY: number, initialX: number, initialY: number;

        this.bind(
            windowId,
            header,
            this._dragRegistry,
            (mouseEvt) => {
                // Ignore if clicking on buttons
                if ((mouseEvt.target as HTMLElement).classList.contains('window-btn')) return false;

                isDragging = true;
                startX = mouseEvt.clientX;
                startY = mouseEvt.clientY;

                // Get current position
                const rect = win.getBoundingClientRect();
                initialX = rect.left;
                initialY = rect.top;

                // Bring to front
                this.bringToFront(win);

                // Prevent text selection
                mouseEvt.preventDefault();
            },
            (mouseEvt) => {
                if (!isDragging) return;

                const deltaX = mouseEvt.clientX - startX;
                const deltaY = mouseEvt.clientY - startY;

                win.style.left = (initialX + deltaX) + 'px';
                win.style.top = (initialY + deltaY) + 'px';
                win.style.transform = 'none'; // Remove centering transform
            },
            () => {
                isDragging = false;
            }
        );

        Utils.Logger.window(`Window ${windowId} is now draggable`);
    }

    public makeResizable(windowId: string): void {
        const win = Utils.getElement(windowId) as HTMLElement | null;
        if (!win) return;

        // Clean up previous resizable listeners if any
        this.destroyResizable(windowId);

        // Add resize handle if it doesn't exist
        let resizeHandle = win.querySelector('.window-resize-handle') as HTMLElement | null;
        if (!resizeHandle) {
            resizeHandle = document.createElement('div');
            resizeHandle.className = 'window-resize-handle';
            win.appendChild(resizeHandle);
        }

        let isResizing = false;
        let startX: number, startY: number, startWidth: number, startHeight: number;

        this.bind(
            windowId,
            resizeHandle,
            this._resizeRegistry,
            (mouseEvt) => {
                isResizing = true;
                startX = mouseEvt.clientX;
                startY = mouseEvt.clientY;

                const rect = win.getBoundingClientRect();
                startWidth = rect.width;
                startHeight = rect.height;

                // Bring to front
                this.bringToFront(win);

                mouseEvt.preventDefault();
                mouseEvt.stopPropagation();
            },
            (mouseEvt) => {
                if (!isResizing) return;

                const deltaX = mouseEvt.clientX - startX;
                const deltaY = mouseEvt.clientY - startY;

                const newWidth = Math.max(200, startWidth + deltaX);
                const newHeight = Math.max(150, startHeight + deltaY);

                win.style.width = newWidth + 'px';
                win.style.height = newHeight + 'px';
            },
            () => {
                isResizing = false;
            }
        );

        Utils.Logger.window(`Window ${windowId} is now resizable`);
    }
}
