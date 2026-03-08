/**
 * WINDOWS 95 APP CENTER - SYSTEM BRIDGE
 * Legacy window.* wrappers for backward compatibility with HTML handlers
 * that haven't been migrated to EventDelegation yet.
 *
 * v1.0 — Extracted from os_engine.js (Fase 2 Refactor)
 *
 * NOTE: New code should use Services.get('X') instead of window.X
 * These wrappers will be removed when all inline HTML handlers are migrated.
 */

import { Utils } from '../utils';
import { Services } from './ServiceContainer';
import { EventBus, createStateBridge } from './EventBus';
import { AudioManager } from '../audio/AudioManager';
import { i18n } from '../services/i18n';

// ============================================
// 1. GLOBAL OS STATE (reactive via Store proxy)
// ============================================
export function initSystemState(): void {
    if (typeof createStateBridge === 'function') {
        (window as any).state = createStateBridge();
        Utils.Logger.log("[SystemBridge] Reactive Store bridge active");
    } else {
        (window as any).state = {
            lang: 'en',
            screen: 'desktop',
            bootComplete: false,
            wallpaper: localStorage.getItem('desktop-wallpaper') || '',
            taskbarColor: localStorage.getItem('taskbar-color') || '#c0c0c0'
        };
        Utils.Logger.log("[SystemBridge] Using plain state (EventBus not loaded)");
    }

    // Initialize i18n
    i18n.init();
    if ((window as any).state) (window as any).state.lang = i18n.getLang();

    // Legacy family data — separate from reactive store (game-specific)
    (window as any).familyData = {
        parents: {
            mother: { name: 'Mary', status: 'alive', occupation: 'System Admin', stats: { happiness: 85, health: 90, intelligence: 80, money: 70, appearance: 75 } },
            father: { name: 'John', status: 'alive', occupation: 'Hardware Engineer', stats: { happiness: 80, health: 85, intelligence: 90, money: 80, appearance: 70 } }
        },
        heritageBonus: { intelligence: 5, appearance: 5, money: 100 }
    };
}

// ============================================
// 2. AUDIO BRIDGE
// ============================================
export function initAudioBridge(): void {
    (window as any).playBlip = (freq: number = 800): void => {
        const tm: any = Services.get('ThemeManager');
        const isModern = tm?.currentTheme === 'modern';
        if (isModern) return;

        const am: any = Services.get('AudioManager') || (window as any).AudioManager;
        if (am) {
            am.play('blip', { frequency: freq });
        }
    };
}

// ============================================
// 3. LEGACY WRAPPERS (for remaining HTML onclick handlers)
// ============================================
export function initLegacyWrappers(): void {
    // Desktop — legacy wrappers (kept for edge cases, but EventDelegation is primary)
    (window as any).setWallpaper = (url: string, silent: boolean = false): void => {
        const dm: any = Services.get('DesktopManager');
        if (dm) dm.setWallpaper(url, silent);
    };
    (window as any).setTaskbarColor = (color: string, silent: boolean = false): void => {
        const dm: any = Services.get('DesktopManager');
        if (dm) dm.setTaskbarColor(color, silent);
    };
    (window as any).handleWallpaperUpload = (input: HTMLInputElement): void => {
        const dm: any = Services.get('DesktopManager');
        if (dm) dm.handleWallpaperUpload(input);
    };

    // Window Manager
    (window as any).openWindow = (id: string): void => {
        if ((window as any).playBlip) (window as any).playBlip();
        const wm: any = Services.get('WindowManager');
        if (wm) wm.open(id);
    };
    (window as any).closeWindow = (id: string): void => {
        if ((window as any).playBlip) (window as any).playBlip();
        const wm: any = Services.get('WindowManager');
        if (wm) wm.close(id);
    };

    // Dialogs
    (window as any).openDialog = (dialogId: string): void => {
        if ((window as any).playBlip) (window as any).playBlip();
        const dialog = document.getElementById(dialogId);
        if (dialog) dialog.style.display = 'block';
    };
    (window as any).closeDialog = (dialogId: string): void => {
        if ((window as any).playBlip) (window as any).playBlip();
        const dialog = document.getElementById(dialogId);
        if (dialog) dialog.style.display = 'none';
    };

    // Shutdown
    (window as any).handleShutdown = function (): void {
        const am: any = Services.get('AudioManager') || (window as any).AudioManager;
        if (am) {
            const tm: any = Services.get('ThemeManager');
            const isModernTheme = tm?.currentTheme === 'modern';
            const shutdownSound = isModernTheme ? 'shutdown_modern' : 'shutdown';
            am.play(shutdownSound, { volume: 0.8 });
        } else {
            if ((window as any).playBlip) (window as any).playBlip();
        }

        const startMenu = document.getElementById('start-menu');
        if (startMenu) startMenu.style.display = 'none';

        setTimeout(() => {
            if ((window as any).openDialog) (window as any).openDialog('dialog-shutdown');
            setTimeout(() => location.reload(), 4000);
        }, 500);
    };

    // --- DELEGATED ACTIONS VIA EVENTBUS ---
    EventBus.on('action:shutdown', () => {
        if ((window as any).handleShutdown) (window as any).handleShutdown();
    });

    EventBus.on('action:wallpaper-browse', () => {
        const upload = document.getElementById('wallpaper-upload');
        if (upload) upload.click();
    });

    // Ragdoll Skins
    EventBus.on('action:ragdoll-skin-standard', () => {
        EventBus.emit('ragdoll:action', 'skin-standard');
    });
    EventBus.on('action:ragdoll-skin-custom', () => {
        EventBus.emit('ragdoll:action', 'skin-custom');
    });

    // Ragdoll Animations
    ['dancing', 'moonwalk', 'backflip', 'jumping', 'waving', 'sitting', 'laughing', 'eating', 'crying', 'yawning'].forEach(anim => {
        EventBus.on(`action:ragdoll-anim-${anim}`, () => {
            const methodMap: Record<string, string> = {
                dancing: 'startDancing',
                moonwalk: 'startMoonwalk',
                backflip: 'startBackflip',
                jumping: 'startJumping',
                waving: 'startWaving',
                sitting: 'startSitting',
                laughing: 'startLaughing',
                eating: 'startEating',
                crying: 'startCrying',
                yawning: 'startYawning'
            };
            const method = methodMap[anim];
            if (method) {
                EventBus.emit('ragdoll:action', method);
            }
        });
    });

    // Ragdoll Emotions
    ['happy', 'neutral', 'sad', 'angry', 'panic', 'hurt'].forEach(emotion => {
        EventBus.on(`action:ragdoll-emotion-${emotion}`, () => {
            EventBus.emit('ragdoll:action', 'emotion', emotion);
        });
    });
}

// ============================================
// 4. CLOCK
// ============================================
export function initClock(): void {
    function updateClock(): void {
        const clock = document.getElementById('taskbar-clock');
        if (!clock) return;

        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        clock.textContent = `${hours}:${minutes}`;
    }

    // Expose for legacy usage
    (window as any).updateClock = updateClock;

    updateClock();
    setInterval(updateClock, 1000);
}
