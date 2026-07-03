let windowControlListenersAttached = false;

export function setupDebugMenu(): void {
    // --- Debug Menu (Ctrl + Alt + W) ---
    if (!windowControlListenersAttached) {
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.ctrlKey && e.altKey && (e.key === 'w' || e.key === 'W')) {
                e.preventDefault();
                if (window.playBlip) window.playBlip(600);
                const debugDialog = document.getElementById('dialog-debug');
                if (debugDialog) {
                    debugDialog.style.display = 'block';
                    debugDialog.style.top = '50%';
                    debugDialog.style.left = '50%';
                    debugDialog.style.transform = 'translate(-50%, -50%)';
                }
            }
        });
        windowControlListenersAttached = true;
    }

    // Debug Menu Actions
    const btnResetDesktop = document.getElementById('btn-reset-desktop');
    if (btnResetDesktop) {
        btnResetDesktop.addEventListener('click', () => {
            if (confirm("Are you sure? This will delete all settings and restart the system.")) {
                // Full System Reset: Clear all localStorage
                localStorage.clear();

                // Play sound and reload
                if (window.playBlip) window.playBlip(900);
                setTimeout(() => location.reload(), 200);
            }
        });
    }
}

export function resetDebugMenuState(): void {
    windowControlListenersAttached = false;
}
