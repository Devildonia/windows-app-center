export function setupStickyNotes(): void {
    const stickyNotes = document.querySelectorAll('.draggable-sticky');
    let activeSticky: HTMLElement | null = null;
    let offX = 0, offY = 0, maxZ = 50;

    stickyNotes.forEach(sticky => {
        sticky.addEventListener('mousedown', startDrag as EventListener);
        sticky.addEventListener('touchstart', startDrag as EventListener, { passive: false });
    });

    function startDrag(this: HTMLElement, e: MouseEvent | TouchEvent): void {
        const target = e.target as HTMLElement;
        if (target.tagName === 'A' || target.tagName === 'BUTTON') return;
        if (e.cancelable) e.preventDefault();
        activeSticky = this;
        activeSticky.classList.add('dragging');
        activeSticky.style.zIndex = String(++maxZ);
        const touch: MouseEvent | Touch = e.type === 'touchstart' ? (e as TouchEvent).touches[0] : (e as MouseEvent);
        const rect = activeSticky.getBoundingClientRect();
        offX = touch.clientX - rect.left;
        offY = touch.clientY - rect.top;
        document.addEventListener('mousemove', drag as EventListener);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchmove', drag as EventListener, { passive: false });
        document.addEventListener('touchend', stopDrag);
    }

    function drag(e: MouseEvent | TouchEvent): void {
        if (!activeSticky) return;
        if (e.cancelable) e.preventDefault();
        const touch: MouseEvent | Touch = e.type === 'touchmove' ? (e as TouchEvent).touches[0] : (e as MouseEvent);
        let newL = touch.clientX - offX;
        let newT = touch.clientY - offY;
        newL = Math.max(0, Math.min(newL, window.innerWidth - activeSticky.offsetWidth));
        newT = Math.max(0, Math.min(newT, window.innerHeight - activeSticky.offsetHeight));
        activeSticky.style.left = newL + 'px';
        activeSticky.style.top = newT + 'px';
        activeSticky.style.right = 'auto';
    }

    function stopDrag(): void {
        if (activeSticky) { activeSticky.classList.remove('dragging'); activeSticky = null; }
        document.removeEventListener('mousemove', drag as EventListener); document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchmove', drag as EventListener); document.removeEventListener('touchend', stopDrag);
    }
}
