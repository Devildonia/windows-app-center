import { Utils } from '../utils';

let draggableListenersAttached = false;
let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
let mouseUpHandler: (() => void) | null = null;

export function initializeDraggableIcons(): void {
    Utils.Logger.log("[DRAG] Initializing draggable icons...");

    const defaultPositions: Record<string, { x: number, y: number }> = {
        'icon-mycomputer': { x: 20, y: 20 },
        'icon-recyclebin': { x: 20, y: 120 },
        'icon-notepad': { x: 20, y: 220 },
        'icon-paint': { x: 20, y: 320 },
        'icon-explorer': { x: 20, y: 420 },
        'icon-display': { x: 20, y: 520 },
        'icon-internet': { x: 20, y: 620 },
        'icon-ragdoll-skins': { x: 20, y: 720 },
        'icon-winamp': { x: 20, y: 820 },
        'icon-games-folder': { x: 120, y: 20 },
        'icon-terminal': { x: 120, y: 120 },
        'icon-taskmanager': { x: 120, y: 220 },
        'icon-pluginmanager': { x: 120, y: 320 }
    };

    const icons = document.querySelectorAll('#system-icons .icon, #app-launch-zone .icon');
    let draggedIcon: HTMLElement | null = null;
    let offsetX = 0, offsetY = 0;

    icons.forEach(iconEl => {
        const icon = iconEl as HTMLElement;
        const savedPosition = localStorage.getItem(`icon-pos-${icon.id}`);
        icon.style.position = 'absolute';

        if (savedPosition) {
            try {
                const pos = JSON.parse(savedPosition);
                icon.style.left = pos.x + 'px';
                icon.style.top = pos.y + 'px';
            } catch (_) {}
        } else if (defaultPositions[icon.id]) {
            const pos = defaultPositions[icon.id];
            if (pos) {
                icon.style.left = pos.x + 'px';
                icon.style.top = pos.y + 'px';
            }
        }

        icon.addEventListener('mousedown', (e: MouseEvent) => {
            if (e.button !== 0 || e.detail === 2) return;
            draggedIcon = icon;
            icon.style.cursor = 'move';
            const rect = icon.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            icon.style.zIndex = '100';
            icon.style.transition = 'none';
            if (window.playBlip) window.playBlip(1000);
            e.preventDefault();
            e.stopPropagation();
        });
        icon.addEventListener('dragstart', (e: DragEvent) => e.preventDefault());
    });

    if (!draggableListenersAttached) {
        mouseMoveHandler = (e: MouseEvent) => {
            if (!draggedIcon) return;
            let currentX = e.clientX - offsetX;
            let currentY = e.clientY - offsetY;
            const desktopRect = document.getElementById('desktop')?.getBoundingClientRect();
            if (!desktopRect) return;
            const taskbarHeight = document.getElementById('taskbar')?.offsetHeight || 40;

            currentX = Math.max(0, Math.min(currentX, desktopRect.width - draggedIcon.offsetWidth));
            currentY = Math.max(0, Math.min(currentY, desktopRect.height - taskbarHeight - draggedIcon.offsetHeight));

            draggedIcon.style.left = currentX + 'px';
            draggedIcon.style.top = currentY + 'px';
        };

        mouseUpHandler = () => {
            if (!draggedIcon) return;
            draggedIcon.style.cursor = 'default';
            draggedIcon.style.zIndex = '';
            draggedIcon.style.transition = '';
            const position = { x: parseInt(draggedIcon.style.left || '0'), y: parseInt(draggedIcon.style.top || '0') };
            localStorage.setItem(`icon-pos-${draggedIcon.id}`, JSON.stringify(position));
            if (window.playBlip) window.playBlip(800);
            draggedIcon = null;
        };

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);

        draggableListenersAttached = true;
    }
}

export function resetDraggableIconsState(): void {
    if (mouseMoveHandler) {
        document.removeEventListener('mousemove', mouseMoveHandler);
        mouseMoveHandler = null;
    }
    if (mouseUpHandler) {
        document.removeEventListener('mouseup', mouseUpHandler);
        mouseUpHandler = null;
    }
    draggableListenersAttached = false;
}
