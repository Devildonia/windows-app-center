import { Services } from './ServiceContainer';

let globalClickListenersAttached = false;

export function setupStartMenu(): void {
    const startBtn = document.getElementById('start-button');
    if (startBtn) {
        startBtn.onclick = (): void => {
            const tm: any = Services.get('ThemeManager');
            const isModern = tm?.currentTheme === 'modern';
            if (isModern) {
                const audio: any = Services.get('AudioManager');
                if (audio) audio.play('menu_modern', { volume: 0.8 });
            } else {
                if (window.playBlip) window.playBlip(600);
            }
            const menu = document.getElementById('start-menu');
            if (menu) {
                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            }
        };
    }

    if (!globalClickListenersAttached) {
        // Global Click Sound & Start Menu Close Logic
        document.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // 1. Play button sound & trigger haptics
            const isClickableIcon = target.closest('.icon') || target.closest('.icon-box');
            const isButton = target.tagName === 'BUTTON' && !target.classList.contains('close-btn');

            if (isButton || isClickableIcon) {
                Services.get('HapticService')?.light();
                const tm: any = Services.get('ThemeManager');
                const isModern = tm?.currentTheme === 'modern';
                if (isModern) {
                    const audio: any = Services.get('AudioManager');
                    if (audio) audio.play('click_modern', { volume: 0.8 });
                } else {
                    if (window.playBlip) window.playBlip(800);
                }
            }

            // 2. Close Start Menu if clicking outside
            const menu = document.getElementById('start-menu');
            const startBtn = document.getElementById('start-button');
            if (menu && menu.style.display === 'block' && startBtn) {
                if (!menu.contains(target) && !startBtn.contains(target)) {
                    menu.style.display = 'none';
                }
            }

            // 3. Close Ragdoll Menu if clicking outside
            const ragMenu = document.getElementById('ragdoll-popup-menu');
            const ragBtn = document.getElementById('ragdollToggle');
            if (ragMenu && ragMenu.style.display === 'flex' && ragBtn) {
                if (!ragMenu.contains(target) && !ragBtn.contains(target)) {
                    ragMenu.style.display = 'none';
                }
            }
        });
        globalClickListenersAttached = true;
    }
}

export function resetStartMenuState(): void {
    globalClickListenersAttached = false;
}
