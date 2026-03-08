/**
 * WINDOWS 95 APP CENTER - TOUCH MANAGER
 * Unified pointer handling for mouse AND touch on windows and icons.
 * Supports drag, double-tap (as dblclick), and long-press (as right-click).
 * Version: 1.0
 */
import { Utils } from '../utils';
import { Services } from '../core/ServiceContainer';
import { WindowManager } from './WindowManager';

export interface ITouchManager {
    init(): void;
    addPointerEvents(element: HTMLElement, handlers: { onStart?: (e: any) => void, onMove?: (e: any) => void, onEnd?: (e: any) => void }): void;
    DOUBLE_TAP_DELAY: number;
    LONG_PRESS_DELAY: number;
}


const TouchManager: ITouchManager = (() => {
    'use strict';

    // Double-tap detection
    const DOUBLE_TAP_DELAY = 300; // ms
    const LONG_PRESS_DELAY = 500; // ms
    const DRAG_THRESHOLD = 8;     // px before drag starts

    let _lastTapTime = 0;
    let _lastTapTarget: Element | null = null;
    let _longPressTimer: ReturnType<typeof setTimeout> | null = null;
    let _initialized = false;

    /**
     * Initialize touch support
     */
    function init(): void {
        if (_initialized) return;
        _initialized = true;

        // Patch WindowManager.makeDraggable to also handle touch
        patchWindowDragging();

        // Patch desktop icon dragging for touch
        patchIconDragging();

        // Add double-tap detection for icons
        setupDoubleTap();

        Utils.Logger.log('[TouchManager] Initialized');
    }

    /**
     * Patches WindowManager's draggable to support touch events
     */
    function patchWindowDragging(): void {
        // Override makeDraggable to add touch support
        const wm: any = Services.get('WindowManager');
        const originalMakeDraggable = wm?.makeDraggable;
        if (!originalMakeDraggable) return;

        wm.makeDraggable = function (windowId: string): void {
            // Call original mouse-based draggable
            originalMakeDraggable(windowId);

            // Add touch dragging
            const win = document.getElementById(windowId);
            if (!win) return;

            const header = win.querySelector('.window-header');
            if (!header) return;

            let isDragging = false;
            let startX: number, startY: number, initialX: number, initialY: number;
            let hasMoved = false;

            header.addEventListener('touchstart', ((e: TouchEvent) => {
                // Ignore if touching buttons
                if ((e.target as HTMLElement).closest('.window-btn')) return;

                const touch = e.touches[0];
                isDragging = true;
                hasMoved = false;
                startX = touch.clientX;
                startY = touch.clientY;

                const rect = win.getBoundingClientRect();
                initialX = rect.left;
                initialY = rect.top;

                // Bring to front
                const wmRef: any = Services.get('WindowManager');
                if (wmRef) {
                    wmRef.bringToFront(win);
                }

                e.preventDefault();
            }) as EventListener, { passive: false });

            document.addEventListener('touchmove', ((e: TouchEvent) => {
                if (!isDragging) return;

                const touch = e.touches[0];
                const deltaX = touch.clientX - startX;
                const deltaY = touch.clientY - startY;

                // Only start dragging after threshold
                if (!hasMoved && Math.abs(deltaX) < DRAG_THRESHOLD && Math.abs(deltaY) < DRAG_THRESHOLD) {
                    return;
                }
                hasMoved = true;

                win.style.left = (initialX + deltaX) + 'px';
                win.style.top = (initialY + deltaY) + 'px';
                win.style.transform = 'none';

                e.preventDefault();
            }) as EventListener, { passive: false });

            document.addEventListener('touchend', () => {
                isDragging = false;
            });

            Utils.Logger.log(`[TouchManager] Touch dragging enabled for ${windowId}`);
        };
    }

    /**
     * Adds touch support to desktop icon dragging
     */
    function patchIconDragging(): void {
        // This supplements the existing mouse-based icon dragging in event_listeners.js
        const icons = document.querySelectorAll('#system-icons .icon, #app-launch-zone .icon');
        let draggedIcon: HTMLElement | null = null;
        let offsetX = 0, offsetY = 0;
        let startTouchX = 0, startTouchY = 0;
        let hasMoved = false;

        icons.forEach(iconEl => {
            const icon = iconEl as HTMLElement;
            icon.addEventListener('touchstart', ((e: TouchEvent) => {
                const touch = e.touches[0];
                startTouchX = touch.clientX;
                startTouchY = touch.clientY;
                hasMoved = false;

                // Start long press timer for potential drag
                _longPressTimer = setTimeout(() => {
                    draggedIcon = icon;
                    icon.style.cursor = 'move';
                    const rect = icon.getBoundingClientRect();
                    offsetX = touch.clientX - rect.left;
                    offsetY = touch.clientY - rect.top;
                    icon.style.zIndex = '100';
                    icon.style.transition = 'none';
                    icon.style.opacity = '0.8';
                }, LONG_PRESS_DELAY);

                // Don't preventDefault here to allow double-tap detection
            }) as EventListener, { passive: true });

            icon.addEventListener('touchmove', ((e: TouchEvent) => {
                const touch = e.touches[0];
                const dx = touch.clientX - startTouchX;
                const dy = touch.clientY - startTouchY;

                // If moved beyond threshold, cancel long-press and start immediate drag
                if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
                    hasMoved = true;
                    if (_longPressTimer) clearTimeout(_longPressTimer);

                    if (!draggedIcon) {
                        // Start dragging immediately after threshold
                        draggedIcon = icon;
                        const rect = icon.getBoundingClientRect();
                        offsetX = startTouchX - rect.left;
                        offsetY = startTouchY - rect.top;
                        icon.style.zIndex = '100';
                        icon.style.transition = 'none';
                        icon.style.opacity = '0.8';
                    }
                }

                if (!draggedIcon) return;
                e.preventDefault();

                let currentX = touch.clientX - offsetX;
                let currentY = touch.clientY - offsetY;

                const desktopRect = document.getElementById('desktop')?.getBoundingClientRect();
                const taskbarHeight = document.getElementById('taskbar')?.offsetHeight || 40;

                if (desktopRect) {
                    currentX = Math.max(0, Math.min(currentX, desktopRect.width - icon.offsetWidth));
                    currentY = Math.max(0, Math.min(currentY, desktopRect.height - taskbarHeight - icon.offsetHeight));
                }

                icon.style.left = currentX + 'px';
                icon.style.top = currentY + 'px';
            }) as EventListener, { passive: false });

            icon.addEventListener('touchend', () => {
                if (_longPressTimer) clearTimeout(_longPressTimer);

                if (draggedIcon) {
                    draggedIcon.style.cursor = '';
                    draggedIcon.style.zIndex = '';
                    draggedIcon.style.transition = '';
                    draggedIcon.style.opacity = '';

                    const position = {
                        x: parseInt(draggedIcon.style.left || '0'),
                        y: parseInt(draggedIcon.style.top || '0')
                    };
                    localStorage.setItem(`icon-pos-${draggedIcon.id}`, JSON.stringify(position));
                    draggedIcon = null;
                }
            });
        });
    }

    /**
     * Sets up double-tap detection for desktop icons (maps to dblclick action)
     */
    function setupDoubleTap(): void {
        const icons = document.querySelectorAll('#system-icons .icon, #app-launch-zone .icon');

        icons.forEach(iconEl => {
            const icon = iconEl as HTMLElement;
            icon.addEventListener('touchend', ((e: TouchEvent) => {
                // Don't trigger dblclick if we were dragging
                if ((e.target as HTMLElement).closest && parseInt(icon.style.zIndex || '0') === 100) return;

                const now = Date.now();
                const isDoubleTap = (
                    now - _lastTapTime < DOUBLE_TAP_DELAY &&
                    _lastTapTarget === icon
                );

                if (isDoubleTap) {
                    // Fire the ondblclick handler
                    e.preventDefault();
                    icon.dispatchEvent(new MouseEvent('dblclick', {
                        bubbles: true,
                        cancelable: true
                    }));
                    _lastTapTime = 0; // Reset to prevent triple-tap
                    _lastTapTarget = null;
                } else {
                    _lastTapTime = now;
                    _lastTapTarget = icon;
                }
            }) as EventListener);
        });
    }

    /**
     * Utility: Add unified pointer events (mouse + touch) to an element
     * @param {HTMLElement} element
     * @param {object} handlers - { onStart, onMove, onEnd }
     */
    function addPointerEvents(element: HTMLElement, handlers: { onStart?: (e: any) => void, onMove?: (e: any) => void, onEnd?: (e: any) => void }): void {
        const { onStart, onMove, onEnd } = handlers;

        // Mouse
        if (onStart) element.addEventListener('mousedown', onStart as EventListener);
        if (onMove) document.addEventListener('mousemove', onMove);
        if (onEnd) document.addEventListener('mouseup', onEnd as EventListener);

        // Touch
        if (onStart) element.addEventListener('touchstart', ((e: TouchEvent) => {
            const touch = e.touches[0];
            const synth = { clientX: touch.clientX, clientY: touch.clientY, target: e.target, preventDefault: () => e.preventDefault() };
            onStart(synth);
        }) as EventListener, { passive: false });

        if (onMove) document.addEventListener('touchmove', ((e: TouchEvent) => {
            if (!e.touches[0]) return;
            const touch = e.touches[0];
            const synth = { clientX: touch.clientX, clientY: touch.clientY, target: e.target, preventDefault: () => e.preventDefault() };
            onMove(synth);
        }) as EventListener, { passive: false });

        if (onEnd) document.addEventListener('touchend', ((e: TouchEvent) => {
            const synth = { target: e.target, preventDefault: () => e.preventDefault() };
            onEnd(synth);
        }) as EventListener);
    }

    return {
        init,
        addPointerEvents,
        DOUBLE_TAP_DELAY,
        LONG_PRESS_DELAY
    };
})();

export { TouchManager };

if (typeof window !== 'undefined') {
    (window as any).TouchManager = TouchManager;
    Services.register('TouchManager', TouchManager);
}
