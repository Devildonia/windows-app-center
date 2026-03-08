/**
 * WINDOWS 95 APP CENTER - EVENT LISTENERS & UI LOGIC
 * Manages dragging, Start menu, and peripheral events
 * Version: 2.1 (ES Modules)
 */

import { Utils } from '../utils';
import { Kernel } from './Kernel';
import { WindowManager } from '../ui/WindowManager';
import { Services } from './ServiceContainer';
import { EventBus } from './EventBus';

export function setupEventListeners(): void {
    const startBtn = document.getElementById('start-button');
    if (startBtn) {
        startBtn.onclick = (): void => {
            const tm: any = Services.get('ThemeManager');
            const isModern = tm?.currentTheme === 'modern';
            if (isModern) {
                const audio: any = Services.get('AudioManager');
                if (audio) audio.play('menu_modern', { volume: 0.8 });
            } else {
                if ((window as any).playBlip) (window as any).playBlip(600);
            }
            const menu = document.getElementById('start-menu');
            if (menu) {
                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            }
        };
    }

    // --- REUSABLE ICON HANDLer ---
    const setupIconAction = (id: string, callback: () => void): void => {
        const icon = document.getElementById(id);
        if (icon) icon.ondblclick = callback;
    };

    // --- Icon handlers ---
    setupIconAction('icon-games-folder', () => { if ((window as any).openWindow) (window as any).openWindow('win-games-folder'); });

    // v1.0.7.5: Bugfix - Game folders should open subfolders, not execute games
    setupIconAction('icon-vlrs-folder', () => {
        WindowManager.close('win-games-folder');
        if ((window as any).openWindow) (window as any).openWindow('win-vlrs-folder');
    });
    setupIconAction('icon-flappy-folder', () => {
        WindowManager.close('win-games-folder');
        if ((window as any).openWindow) (window as any).openWindow('win-flappy-folder');
    });
    setupIconAction('icon-football-folder', () => {
        WindowManager.close('win-games-folder');
        if ((window as any).openWindow) (window as any).openWindow('win-football-folder');
    });
    setupIconAction('icon-doom-folder', () => {
        WindowManager.close('win-games-folder');
        if ((window as any).openWindow) (window as any).openWindow('win-doom-folder');
    });
    setupIconAction('icon-tetris-folder', () => {
        WindowManager.close('win-games-folder');
        if ((window as any).openWindow) (window as any).openWindow('win-tetris-folder');
    });

    // EXE icons actions
    setupIconAction('icon-flappy-neon-exe', () => { WindowManager.close('win-flappy-folder'); Kernel.launch('flappy-neon'); });
    setupIconAction('icon-football-rush-exe', () => { WindowManager.close('win-football-folder'); Kernel.launch('football-rush'); });
    setupIconAction('icon-doom-exe', () => { WindowManager.close('win-doom-folder'); Kernel.launch('doom'); });
    setupIconAction('icon-tetris-exe', () => { WindowManager.close('win-tetris-folder'); Kernel.launch('tetris-tryhard'); });

    // Back navigation
    const setupBackBtn = (btnId: string, hideId: string, showId: string): void => {
        const btn = document.getElementById(btnId);
        if (btn) btn.onclick = () => {
            WindowManager.close(hideId);
            if ((window as any).openWindow) (window as any).openWindow(showId);
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
        if (icon) icon.ondblclick = () => {
            Kernel.launch('notepad', { file: filename, content: contentText });
        };
    };

    // README Content
    const VLRS_README = "VIRTUAL LIFE RESTART SIMULATOR\n================================\n\nTake control of a new life! Make choices, manage your stats, and see where your decisions take you.\n\nInstructions:\n- Use the mouse to interact with the UI.\n- Make decisions carefully!\n- Manage your health, wealth, and happiness.";

    const FLAPPY_README = "FLAPPY NEON\n===========\n\nNavigate the neon bird through the pipes!\n\nInstructions:\n- Press SPACE or Click to jump.\n- Avoid the pipes.\n- Get the highest score!";

    const FOOTBALL_README = "FOOTBALL RUSH\n=============\n\nScore the winning goal!\n\nInstructions:\n- Use Arrow Keys to move.\n- Press SPACE to shoot.\n- Avoid defenders and the goalie.";

    const DOOM_README = "ULTIMATE DOOM\n=============\n\nThe classic FPS game in your browser!\n\nControls:\n- ARROWS: Move/Turn\n- CTRL: Fire\n- SPACE: Open Doors\n- SHIFT: Run\n\nWarning: This is the shareware version.";

    const TETRIS_README = "TETRIS TRYHARD\n==============\n\nClassic block-stacking puzzle game — but tryhard edition!\n\nControls:\n- LEFT / RIGHT: Move piece\n- UP: Rotate (SRS)\n- DOWN: Soft drop\n- SPACE: Hard drop\n- C: Hold piece\n\nFeatures:\n- 7-Bag randomizer\n- Ghost piece\n- High-score leaderboard";

    setupReadme('icon-readme-inside', 'Readme.txt', VLRS_README);
    setupReadme('icon-flappy-readme', 'README.TXT', FLAPPY_README);
    setupReadme('icon-football-readme', 'README.TXT', FOOTBALL_README);
    setupReadme('icon-doom-readme', 'README.TXT', DOOM_README);
    setupReadme('icon-tetris-readme', 'README.TXT', TETRIS_README);

    setupIconAction('icon-game-inside', () => { Kernel.launch('vlrs'); });

    setupIconAction('icon-mycomputer', () => { if ((window as any).state?.bootComplete && (window as any).openDialog) (window as any).openDialog('dialog-mycomputer'); });
    setupIconAction('icon-recyclebin', () => { if ((window as any).state?.bootComplete && (window as any).openDialog) (window as any).openDialog('dialog-recyclebin'); });
    setupIconAction('icon-display', () => { if ((window as any).openWindow) (window as any).openWindow('win-display-props'); });

    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const tm: any = Services.get('ThemeManager');
            if (!tm) return;
            const nextTheme = tm.currentTheme === 'win95' ? 'modern' : 'win95';
            tm.applyTheme(nextTheme);
            if ((window as any).playBlip) (window as any).playBlip(600);
        });
    }

    // Ragdoll Toggle Button & Menu
    const ragdollToggle = document.getElementById('ragdollToggle');
    const ragdollMenu = document.getElementById('ragdoll-popup-menu');
    if (ragdollToggle && ragdollMenu) {
        ragdollToggle.addEventListener('click', (e) => {
            if ((window as any).playBlip) (window as any).playBlip(600);
            ragdollMenu.style.display = ragdollMenu.style.display === 'flex' ? 'none' : 'flex';
            e.stopPropagation(); // Prevent global click from immediately closing it
        });

        document.getElementById('spawn-ragdoll-2d')?.addEventListener('click', () => {
            if ((window as any).playBlip) (window as any).playBlip(600);
            ragdollMenu.style.display = 'none';
            EventBus.emit('ragdoll:toggle');
        });

        document.getElementById('spawn-ragdoll-3d')?.addEventListener('click', () => {
            if ((window as any).playBlip) (window as any).playBlip(600);
            ragdollMenu.style.display = 'none';
            EventBus.emit('ragdoll3d:toggle');
        });



        EventBus.on('ragdoll:state', (isActive: boolean) => {
            ragdollToggle.classList.toggle('active', !!isActive);
        });
        
        EventBus.on('ragdoll3d:state', (isActive: boolean) => {
            ragdollToggle.classList.toggle('active', !!isActive);
        });
    }

    // Display Properties Tabs Logic
    const displayTabs = document.querySelectorAll('.display-tab-btn');
    displayTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            displayTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked
            tab.classList.add('active');

            // Hide all content
            document.querySelectorAll('.display-tab-content').forEach(content => {
                (content as HTMLElement).style.display = 'none';
            });

            // Show target content
            const targetId = tab.getAttribute('data-target');
            if (targetId) {
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    targetEl.style.display = 'block';
                }
            }
            if ((window as any).playBlip) (window as any).playBlip(900);
        });
    });

    // Files actions

    setupIconAction('icon-internet', () => {
        if ((window as any).openWindow) (window as any).openWindow('win-internet-explorer');
        // Initial load if blank
        const frame = document.getElementById('ie-frame') as HTMLIFrameElement | null;
        if (frame && frame.src === 'about:blank') {
            if ((window as any).navigateIE) (window as any).navigateIE('https://www.google.com/webhp?igu=1');
        }
    });
    setupIconAction('icon-ragdoll-skins', () => { if ((window as any).openWindow) (window as any).openWindow('win-ragdoll-skins'); });
    setupIconAction('icon-secrets-file', () => { if ((window as any).openDialog) (window as any).openDialog('dialog-encryption'); });
    setupIconAction('icon-winamp', () => { Kernel.launch('webamp'); });


    // Generic Close Buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        (btn as HTMLElement).onclick = (e: MouseEvent) => {
            if ((window as any).playBlip) (window as any).playBlip(700);
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

    // Global Click Sound & Start Menu Close Logic
    document.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // 1. Play button sound
        const isClickableIcon = target.closest('.icon') || target.closest('.icon-box');
        const isButton = target.tagName === 'BUTTON' && !target.classList.contains('close-btn');

        if (isButton || isClickableIcon) {
            const tm: any = Services.get('ThemeManager');
            const isModern = tm?.currentTheme === 'modern';
            if (isModern) {
                const audio: any = Services.get('AudioManager');
                if (audio) audio.play('click_modern', { volume: 0.8 });
            } else {
                if ((window as any).playBlip) (window as any).playBlip(800);
            }
        }

        // 2. Close Start Menu if clicking outside
        const menu = document.getElementById('start-menu');
        const startBtn = document.getElementById('start-button');
        if (menu && menu.style.display === 'block' && startBtn) {
            // If click is NOT on menu AND NOT on start button (or its children)
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

    // Initialize Draggable Icons
    initializeDraggableIcons();

    // --- ACCESSIBILITY: Keyboard Navigation ---
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        // Ignore if user is typing in an input or textarea
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        if (target.tabIndex === 0 && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            // Trigger dblclick or click action
            if (target.ondblclick) target.ondblclick(new MouseEvent('dblclick') as any);
            else if (target.onclick) target.onclick(new MouseEvent('click') as any);
            else {
                // Check if it's a desktop icon with dblclick listener
                const event = new MouseEvent('dblclick', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                target.dispatchEvent(event);
            }
        }
    });
};

export function initializeDraggableIcons(): void {
    Utils.Logger.log("[DRAG] Initializing draggable icons...");

    const defaultPositions: Record<string, { x: number, y: number }> = {
        // System icons - Left Column
        'icon-mycomputer': { x: 20, y: 20 },
        'icon-recyclebin': { x: 20, y: 120 },
        'icon-notepad': { x: 20, y: 220 },
        'icon-paint': { x: 20, y: 320 },
        'icon-explorer': { x: 20, y: 420 },
        'icon-display': { x: 20, y: 520 },
        'icon-internet': { x: 20, y: 620 },
        'icon-ragdoll-skins': { x: 20, y: 720 },
        'icon-winamp': { x: 20, y: 820 },

        // Games folder - Center
        'icon-games-folder': { x: window.innerWidth / 2 - 40, y: window.innerHeight / 2 - 60 }
    };

    // Remove legacy JS setup that conflicts with HTML attributes
    // setupAppLaunch calls removed as they are now in HTML onclick/ondblclick

    // Icons initialized via HTML attributes or specific logic below

    const icons = document.querySelectorAll('#system-icons .icon, #app-launch-zone .icon');
    let draggedIcon: HTMLElement | null = null;
    let offsetX = 0, offsetY = 0;

    icons.forEach(iconEl => {
        const icon = iconEl as HTMLElement;
        const savedPosition = localStorage.getItem(`icon-pos-${icon.id}`);
        icon.style.position = 'absolute';

        if (savedPosition) {
            const pos = JSON.parse(savedPosition);
            icon.style.left = pos.x + 'px';
            icon.style.top = pos.y + 'px';
        } else if (defaultPositions[icon.id]) {
            const pos = defaultPositions[icon.id];
            icon.style.left = pos.x + 'px';
            icon.style.top = pos.y + 'px';
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
            if ((window as any).playBlip) (window as any).playBlip(1000);
            e.preventDefault();
            e.stopPropagation();
        });
        icon.addEventListener('dragstart', (e: DragEvent) => e.preventDefault());
    });

    document.addEventListener('mousemove', (e: MouseEvent) => {
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
    });

    document.addEventListener('mouseup', () => {
        if (!draggedIcon) return;
        draggedIcon.style.cursor = 'default';
        draggedIcon.style.zIndex = '';
        draggedIcon.style.transition = '';
        const position = { x: parseInt(draggedIcon.style.left || '0'), y: parseInt(draggedIcon.style.top || '0') };
        localStorage.setItem(`icon-pos-${draggedIcon.id}`, JSON.stringify(position));
        if ((window as any).playBlip) (window as any).playBlip(800);
        draggedIcon = null;
    });
};

export function initializeWindowControls(): void {
    // NOTE: WindowManager.initializeControls() is now called ONCE from initOS().
    // This legacy wrapper only sets up supplementary UI handlers (sound effects, debug menu)
    // and does NOT call WindowManager.initializeControls() again.
    Utils.Logger.log("[WINDOW] Setting up supplementary window UI handlers...");

    document.querySelectorAll('.win95-window').forEach(winEl => {
        const win = winEl as HTMLElement;
        const setupBtn = (selector: string, action: EventListener): void => {
            const btn = win.querySelector(selector) as HTMLElement | null;
            if (btn) btn.addEventListener('click', action);
        };

        setupBtn('.maximize-btn', (e: Event) => {
            if ((window as any).playBlip) (window as any).playBlip(700);
            (e.target as HTMLElement).textContent = win.classList.contains('maximized') ? '❐' : '□';
        });
        setupBtn('.minimize-btn', () => { if ((window as any).playBlip) (window as any).playBlip(700); });
        setupBtn('.close-btn', () => {
            if ((window as any).playBlip) (window as any).playBlip(700);
            win.classList.remove('maximized');
            const maxBtn = win.querySelector('.maximize-btn');
            if (maxBtn) maxBtn.textContent = '□';
        });
    });

    // --- Debug Menu (Ctrl + Alt + D) ---
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.ctrlKey && e.altKey && (e.key === 'w' || e.key === 'W')) {
            e.preventDefault();
            if ((window as any).playBlip) (window as any).playBlip(600);
            const debugDialog = document.getElementById('dialog-debug');
            if (debugDialog) {
                debugDialog.style.display = 'block';
                // Center it just in case
                debugDialog.style.top = '50%';
                debugDialog.style.left = '50%';
                debugDialog.style.transform = 'translate(-50%, -50%)';
            }
        }
    });

    // Debug Menu Actions
    const btnResetDesktop = document.getElementById('btn-reset-desktop');
    if (btnResetDesktop) {
        btnResetDesktop.addEventListener('click', () => {
            if (confirm("Are you sure? This will delete all settings and restart the system.")) {
                // Full System Reset: Clear all localStorage
                localStorage.clear();

                // 3. Play sound and reload
                if ((window as any).playBlip) (window as any).playBlip(900);
                setTimeout(() => location.reload(), 200);
            }
        });
    }
}

// Legacy globals for os_engine compatibility
if (typeof window !== 'undefined') {
    (window as any).setupEventListeners = setupEventListeners;
    (window as any).initializeDraggableIcons = initializeDraggableIcons;
    (window as any).initializeWindowControls = initializeWindowControls;
}

// Sticky Notes logic
(function (): void {
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
})();
