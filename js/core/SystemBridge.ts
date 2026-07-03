/**
 * WINDOWS 95 APP CENTER - SYSTEM BRIDGE
 * Minimal legacy bridge for remaining window.* consumers.
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
        const isModern = getThemeManager()?.currentTheme === 'modern';
        if (isModern) return;

        const am: any = getAudioManager();
        if (am) {
            am.play('blip', { frequency: freq });
        }
    };
}

export function destroyAudioBridge(): void {
    delete (window as any).playBlip;
}

function getThemeManager(): any {
    return Services.get('ThemeManager');
}

function getAudioManager(): any {
    return Services.get('AudioManager') || (window as any).AudioManager;
}

function bindLegacyAction<T extends any[]>(name: string, handler: (...args: T) => void): void {
    (window as any)[name] = (...args: T): void => handler(...args);
}

function setDialogVisibility(dialogId: string, visible: boolean): void {
    const dialog = document.getElementById(dialogId);
    if (dialog) dialog.style.display = visible ? 'block' : 'none';
}

export function destroyLegacyWrappers(): void {
    if (!(window as any).__legacyWrappersInitialized) return;

    ['setWallpaper', 'setTaskbarColor', 'handleWallpaperUpload', 'openWindow', 'closeWindow', 'openDialog', 'closeDialog', 'handleShutdown'].forEach((name) => {
        delete (window as any)[name];
    });

    (window as any).__legacyWrappersInitialized = false;
}

// ============================================
// 3. LEGACY WRAPPERS (for remaining HTML onclick handlers)
// ============================================
export function initLegacyWrappers(): void {
    if ((window as any).__legacyWrappersInitialized) return;
    (window as any).__legacyWrappersInitialized = true;

    bindLegacyAction('setWallpaper', (url: string, silent: boolean = false): void => {
        Services.get('DesktopManager')?.setWallpaper(url, silent);
    });
    bindLegacyAction('setTaskbarColor', (color: string, silent: boolean = false): void => {
        Services.get('DesktopManager')?.setTaskbarColor(color, silent);
    });
    bindLegacyAction('handleWallpaperUpload', (input: HTMLInputElement): void => {
        Services.get('DesktopManager')?.handleWallpaperUpload(input);
    });

    bindLegacyAction('openWindow', (id: string): void => {
        (window as any).playBlip?.();
        Services.get('WindowManager')?.open(id);
    });
    bindLegacyAction('closeWindow', (id: string): void => {
        (window as any).playBlip?.();
        Services.get('WindowManager')?.close(id);
    });

    bindLegacyAction('openDialog', (dialogId: string): void => {
        (window as any).playBlip?.();
        setDialogVisibility(dialogId, true);
    });
    bindLegacyAction('closeDialog', (dialogId: string): void => {
        (window as any).playBlip?.();
        setDialogVisibility(dialogId, false);
    });

    bindLegacyAction('handleShutdown', (): void => {
        const am: any = getAudioManager();
        if (am) {
            const isModernTheme = getThemeManager()?.currentTheme === 'modern';
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
    });

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
    const existingInterval = (window as any).__clockIntervalId as number | undefined;
    if (typeof existingInterval === 'number') {
        clearInterval(existingInterval);
    }

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
    (window as any).__clockIntervalId = window.setInterval(updateClock, 1000);
}

export function destroyClock(): void {
    const existingInterval = (window as any).__clockIntervalId as number | undefined;
    if (typeof existingInterval === 'number') {
        clearInterval(existingInterval);
        delete (window as any).__clockIntervalId;
    }
    delete (window as any).updateClock;
}
