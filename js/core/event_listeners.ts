/**
 * WINDOWS 95 APP CENTER - EVENT LISTENERS & UI LOGIC
 * Version: 2.2 (ES Modules - Decomposed Architecture)
 */

import { Utils } from '../utils';
import { Kernel } from './Kernel';
import { WindowManager } from '../ui/WindowManager';
import { Services } from './ServiceContainer';
import { setupStartMenu, resetStartMenuState } from './StartMenuController';
import { initializeDraggableIcons, resetDraggableIconsState } from './DesktopIconController';
import { setupDisplayProperties } from './DisplayPropertiesController';
import { setupKeyboardNavigation, resetKeyboardNavigationState } from './KeyboardNavigationController';
import { setupDebugMenu, resetDebugMenuState } from './DebugMenuController';
import { setupStickyNotes } from './StickyNotesController';

export function setupEventListeners(): void {
    const openLegacyWindow = (windowId: string): void => {
        if (window.openWindow) {
            window.openWindow(windowId);
        } else {
            WindowManager.open(windowId);
        }
    };

    const openLegacyDialog = (dialogId: string): void => {
        if (window.openDialog) {
            window.openDialog(dialogId);
        } else {
            const dialog = document.getElementById(dialogId);
            if (dialog) dialog.style.display = 'block';
        }
    };

    const closeWindowThenOpen = (hideId: string, showId: string): void => {
        WindowManager.close(hideId);
        openLegacyWindow(showId);
    };

    const launchKernelApp = (appId: string, params?: Record<string, any>): void => {
        if (params) Kernel.launch(appId, params);
        else Kernel.launch(appId);
    };

    const setupIconAction = (id: string, callback: () => void): void => {
        const icon = document.getElementById(id);
        if (icon) icon.ondblclick = callback;
    };

    // --- Start Menu ---
    setupStartMenu();

    // --- Icon handlers ---
    setupIconAction('icon-games-folder', () => openLegacyWindow('win-games-folder'));
    setupIconAction('icon-vlrs-folder', () => closeWindowThenOpen('win-games-folder', 'win-vlrs-folder'));
    setupIconAction('icon-flappy-folder', () => closeWindowThenOpen('win-games-folder', 'win-flappy-folder'));
    setupIconAction('icon-football-folder', () => closeWindowThenOpen('win-games-folder', 'win-football-folder'));
    setupIconAction('icon-doom-folder', () => closeWindowThenOpen('win-games-folder', 'win-doom-folder'));
    setupIconAction('icon-tetris-folder', () => closeWindowThenOpen('win-games-folder', 'win-tetris-folder'));

    // EXE icons actions
    setupIconAction('icon-flappy-neon-exe', () => { WindowManager.close('win-flappy-folder'); launchKernelApp('flappy-neon'); });
    setupIconAction('icon-football-rush-exe', () => { WindowManager.close('win-football-folder'); launchKernelApp('football-rush'); });
    setupIconAction('icon-doom-exe', () => { WindowManager.close('win-doom-folder'); launchKernelApp('doom'); });
    setupIconAction('icon-tetris-exe', () => { WindowManager.close('win-tetris-folder'); launchKernelApp('tetris-tryhard'); });

    // Back navigation
    const setupBackBtn = (btnId: string, hideId: string, showId: string): void => {
        const btn = document.getElementById(btnId);
        if (btn) btn.onclick = () => {
            closeWindowThenOpen(hideId, showId);
        };
    };

    setupBackBtn('back-to-games-from-flappy', 'win-flappy-folder', 'win-games-folder');
    setupBackBtn('back-to-games-from-football', 'win-football-folder', 'win-games-folder');
    setupBackBtn('back-to-games-from-doom', 'win-doom-folder', 'win-games-folder');
    setupBackBtn('back-to-games-from-tetris', 'win-tetris-folder', 'win-games-folder');
    setupBackBtn('back-to-games', 'win-vlrs-folder', 'win-games-folder');
    setupBackBtn('back-to-vlrs-from-project', 'win-project-folder', 'win-vlrs-folder');
    setupBackBtn('back-to-vlrs-from-family', 'win-family-folder', 'win-vlrs-folder');

    // READMEs
    const setupReadme = (iconId: string, filename: string, contentText: string): void => {
        const icon = document.getElementById(iconId);
        if (icon) icon.ondblclick = () => launchKernelApp('notepad', { file: filename, content: contentText });
    };

    // README Content
    const VLRS_README = "VIRTUAL LIFE RESTART SIMULATOR\n================================\n\nTake control of a new life! Make choices, manage your stats, and see where your decisions take you.\n\nInstructions:\n- Use the mouse to interact with the UI.\n- Make decisions carefully!\n- Manage your health, wealth, and happiness.";
    const FLAPPY_README = "FLAPPY NEON\n===========\n\nNavigate the neon bird through the pipes!\n\nInstructions:\n- Press SPACE or Click to jump.\n- Avoid the pipes.\n- Get the highest score!";
    const FOOTBALL_README = "FOOTBALL RUSH\n=============\n\nRun, dodge, and score!\n\nInstructions:\n- Use arrow keys to move.\n- Press SPACE to kick/shoot.";
    const DOOM_README = "DOOM CLASSIC\n============\n\nThe legendary 90s FPS.\n\nInstructions:\n- W/A/S/D to move.\n- Click/Ctrl to shoot.\n- Space to interact.";
    const TETRIS_README = "TETRIS TRYHARD\n==============\n\nPure block-stacking action.\n\nInstructions:\n- Use arrow keys to move/rotate blocks.\n- Space to drop.";

    setupReadme('icon-vlrs-readme', 'README_VLRS.TXT', VLRS_README);
    setupReadme('icon-flappy-readme', 'README_FLAPPY.TXT', FLAPPY_README);
    setupReadme('icon-football-readme', 'README_FOOTBALL.TXT', FOOTBALL_README);
    setupReadme('icon-doom-readme', 'README_DOOM.TXT', DOOM_README);
    setupReadme('icon-tetris-readme', 'README_TETRIS.TXT', TETRIS_README);

    // Folder icons actions
    setupIconAction('icon-display', () => openLegacyWindow('win-display-props'));
    setupIconAction('icon-notepad', () => launchKernelApp('notepad'));
    setupIconAction('icon-paint', () => launchKernelApp('paint'));
    setupIconAction('icon-explorer', () => launchKernelApp('explorer'));
    setupIconAction('icon-internet', () => launchKernelApp('internet-explorer'));
    setupIconAction('icon-ragdoll-skins', () => openLegacyWindow('win-ragdoll-skins'));
    setupIconAction('icon-secrets-file', () => openLegacyDialog('dialog-encryption'));
    setupIconAction('icon-winamp', () => launchKernelApp('webamp'));

    // Generic Close Buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        (btn as HTMLElement).onclick = (e: MouseEvent) => {
            if (window.playBlip) window.playBlip(700);
            Services.get('HapticService')?.medium();
            const win = (e.target as HTMLElement).closest('.win95-window, .win95-dialog') as HTMLElement | null;
            if (win) {
                if (win.classList.contains('win95-dialog')) {
                    win.style.display = 'none';
                } else if (win.id) {
                    WindowManager.close(win.id);
                } else {
                    win.style.display = 'none';
                }
            }
        };
    });

    // Display Properties Setup
    setupDisplayProperties();

    // Draggable Icons Initialization
    initializeDraggableIcons();

    // Accessibility & Keyboard Navigation Setup
    setupKeyboardNavigation();
}

export { initializeDraggableIcons };

export function initializeWindowControls(): void {
    Utils.Logger.log("[WINDOW] Setting up supplementary window UI handlers...");

    document.querySelectorAll('.win95-window').forEach(winEl => {
        const win = winEl as HTMLElement;
        const setupBtn = (selector: string, action: EventListener): void => {
            const btn = win.querySelector(selector) as HTMLElement | null;
            if (btn) btn.addEventListener('click', action);
        };

        setupBtn('.maximize-btn', (e: Event) => {
            if (window.playBlip) window.playBlip(700);
            (e.target as HTMLElement).textContent = win.classList.contains('maximized') ? '❐' : '□';
        });
        setupBtn('.minimize-btn', () => { if (window.playBlip) window.playBlip(700); });
        setupBtn('.close-btn', () => {
            if (window.playBlip) window.playBlip(700);
            win.classList.remove('maximized');
            const maxBtn = win.querySelector('.maximize-btn');
            if (maxBtn) maxBtn.textContent = '□';
        });
    });

    // Debug Menu and reset setup
    setupDebugMenu();
}

// Setup sticky notes dragging
setupStickyNotes();

// Legacy globals for os_engine compatibility
if (typeof window !== 'undefined') {
    window.setupEventListeners = setupEventListeners;
    window.initializeDraggableIcons = initializeDraggableIcons;
    window.initializeWindowControls = initializeWindowControls;
}

export function __resetEventListenersState(): void {
    resetStartMenuState();
    resetDraggableIconsState();
    resetKeyboardNavigationState();
    resetDebugMenuState();
}
