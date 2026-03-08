/**
 * WINDOWS 95 APP CENTER - NOTEPAD
 * Simple text editor with Undo support
 * Version: 5.0 (TypeScript)
 *
 * Changelog v5.0:
 *  - NEW: Menú desplegable nativo Win95 — elimina todos los prompt() del browser.
 *  - NEW: Dialogs retro para Open, Save As y Find (sin alert/confirm/prompt).
 *  - NEW: VFS integration — guardar y abrir ficheros vía Virtual File System.
 *        Los ficheros persisten en C:\DOCUMENTS\ y son visibles en FileExplorer.
 *  - NEW: Edit menu funcional: Undo, Cut, Copy, Paste, Select All.
 *  - NEW: Find dialog con búsqueda incremental en el textarea.
 *  - NEW: Atajos de teclado: Ctrl+S, Ctrl+N, Ctrl+O, Ctrl+F, Ctrl+Z.
 *  - FIX: terminate() limpia todos los listeners (herencia de v4.3).
 */

import { Utils } from '../utils.js';
import { WindowManager, IWindowManager } from '../ui/WindowManager.js';
import { INotify } from '../ui/NotificationManager.js';
import { Kernel } from '../core/Kernel.js';
import { Services } from '../core/ServiceContainer.js';
import { VFS } from '../core/VFS.js';

export interface INotepadParams {
    file?: string;
    content?: string;
    path?: string; // VFS path where file resides
}

// Default save directory in VFS
const VFS_SAVE_DIR = 'C:\\DOCUMENTS';

class Notepad {
    public windowId: string = 'win-notepad';
    private textareaId: string = 'notepad-textarea';
    private currentFile: string;
    private currentPath: string; // full VFS path (dir only)
    private isModified: boolean = false;
    private textarea: HTMLTextAreaElement | null = null;

    // Find state
    private _lastFindIndex: number = -1;
    private _lastFindTerm: string = '';

    // Cleanup registry
    private _cleanups: Array<() => void> = [];

    constructor(params: INotepadParams = {}) {
        this.currentFile = params.file || 'Untitled';
        this.currentPath = params.path || VFS_SAVE_DIR;
        this.init(params.content || '');
    }

    // ─── Init ─────────────────────────────────────────────────────────────────

    private init(initialContent: string): void {
        this.textarea = document.getElementById(this.textareaId) as HTMLTextAreaElement | null;
        if (!this.textarea) return;

        if (initialContent) {
            this.textarea.value = initialContent;
        }

        this._setupTextareaListeners();
        this._setupMenuListeners();
        this._setupDialogListeners();
        this._setupKeyboardShortcuts();
        this._closeMenusOnOutsideClick();

        this.updateTitle();
        this._updateStatus();
        Utils.Logger.log('[Notepad] v5.0 initialized');
    }

    // ─── Textarea ─────────────────────────────────────────────────────────────

    private _setupTextareaListeners(): void {
        const inputHandler = () => {
            if (!this.isModified) {
                this.isModified = true;
                this.updateTitle();
            }
            this._updateStatus();
        };
        this.textarea!.addEventListener('input', inputHandler);
        this._cleanups.push(() => this.textarea?.removeEventListener('input', inputHandler));
    }

    private _updateStatus(): void {
        const status = document.getElementById('notepad-status');
        if (!status || !this.textarea) return;
        const text = this.textarea.value;
        const lines = text.split('\n').length;
        const chars = text.length;
        status.textContent = `Ln ${lines}, Ch ${chars}`;
    }

    // ─── Dropdown Menu ────────────────────────────────────────────────────────

    private _setupMenuListeners(): void {
        const menuBar = document.getElementById('notepad-menu-bar');
        if (!menuBar) return;

        // Toggle dropdown on label click
        const labelClickHandler = (e: Event) => {
            const label = (e.target as HTMLElement).closest('.notepad-menu-label');
            if (!label) return;
            const entry = label.closest('.notepad-menu-entry') as HTMLElement;
            if (!entry) return;

            const isOpen = entry.classList.contains('open');
            this._closeAllDropdowns();
            if (!isOpen) entry.classList.add('open');

            e.stopPropagation();
        };
        menuBar.addEventListener('click', labelClickHandler);
        this._cleanups.push(() => menuBar.removeEventListener('click', labelClickHandler));

        // Handle dropdown item actions
        const itemClickHandler = (e: Event) => {
            const item = (e.target as HTMLElement).closest('.notepad-dropdown-item') as HTMLElement;
            if (!item || item.classList.contains('disabled')) return;

            const action = item.dataset.notepadAction;
            if (action) {
                this._closeAllDropdowns();
                this._executeAction(action);
            }
            e.stopPropagation();
        };
        menuBar.addEventListener('click', itemClickHandler);
        // (same handler — no double-push needed, both on menuBar already)
    }

    private _closeAllDropdowns(): void {
        const entries = document.querySelectorAll(`#${this.windowId} .notepad-menu-entry.open`);
        entries.forEach(e => e.classList.remove('open'));
    }

    private _closeMenusOnOutsideClick(): void {
        const outsideHandler = (e: Event) => {
            const menuBar = document.getElementById('notepad-menu-bar');
            if (menuBar && !menuBar.contains(e.target as Node)) {
                this._closeAllDropdowns();
            }
        };
        document.addEventListener('click', outsideHandler);
        this._cleanups.push(() => document.removeEventListener('click', outsideHandler));
    }

    // ─── Dialog Listeners ─────────────────────────────────────────────────────

    private _setupDialogListeners(): void {
        // Open dialog
        this._bindBtn('notepad-open-ok', () => this._confirmOpen());
        this._bindBtn('notepad-open-cancel', () => this._hideDialog('notepad-open-dialog'));

        const openInput = document.getElementById('notepad-open-input') as HTMLInputElement;
        if (openInput) {
            const enterHandler = (e: KeyboardEvent) => { if (e.key === 'Enter') this._confirmOpen(); };
            openInput.addEventListener('keydown', enterHandler);
            this._cleanups.push(() => openInput.removeEventListener('keydown', enterHandler));
        }

        // Save As dialog
        this._bindBtn('notepad-saveas-ok', () => this._confirmSaveAs());
        this._bindBtn('notepad-saveas-cancel', () => this._hideDialog('notepad-saveas-dialog'));

        const saveInput = document.getElementById('notepad-saveas-input') as HTMLInputElement;
        if (saveInput) {
            const enterHandler = (e: KeyboardEvent) => { if (e.key === 'Enter') this._confirmSaveAs(); };
            saveInput.addEventListener('keydown', enterHandler);
            this._cleanups.push(() => saveInput.removeEventListener('keydown', enterHandler));
        }

        // Find dialog
        this._bindBtn('notepad-find-next', () => this._findNext());
        this._bindBtn('notepad-find-cancel', () => this._hideDialog('notepad-find-dialog'));

        const findInput = document.getElementById('notepad-find-input') as HTMLInputElement;
        if (findInput) {
            const enterHandler = (e: KeyboardEvent) => { if (e.key === 'Enter') this._findNext(); };
            findInput.addEventListener('keydown', enterHandler);
            this._cleanups.push(() => findInput.removeEventListener('keydown', enterHandler));
        }
    }

    private _bindBtn(id: string, fn: () => void): void {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('click', fn);
        this._cleanups.push(() => btn.removeEventListener('click', fn));
    }

    // ─── Keyboard Shortcuts ───────────────────────────────────────────────────

    private _setupKeyboardShortcuts(): void {
        const win = document.getElementById(this.windowId);
        if (!win) return;

        const kbHandler = (e: KeyboardEvent) => {
            if (!e.ctrlKey) return;
            switch (e.key.toLowerCase()) {
                case 's': e.preventDefault(); this._executeAction(e.shiftKey ? 'save-as' : 'save'); break;
                case 'n': e.preventDefault(); this._executeAction('new'); break;
                case 'o': e.preventDefault(); this._executeAction('open'); break;
                case 'f': e.preventDefault(); this._executeAction('find'); break;
                case 'z': e.preventDefault(); this._executeAction('undo'); break;
            }
        };
        win.addEventListener('keydown', kbHandler);
        this._cleanups.push(() => win.removeEventListener('keydown', kbHandler));
    }

    // ─── Action Dispatcher ────────────────────────────────────────────────────

    private _executeAction(action: string): void {
        switch (action) {
            case 'new':        this._newFile(); break;
            case 'open':       this._showOpenDialog(); break;
            case 'save':       this._saveFile(); break;
            case 'save-as':    this._showSaveAsDialog(); break;
            case 'exit':       this._exitApp(); break;
            case 'undo':       document.execCommand('undo'); break;
            case 'cut':        document.execCommand('cut'); break;
            case 'copy':       document.execCommand('copy'); break;
            case 'paste':      document.execCommand('paste'); break;
            case 'select-all': this.textarea?.select(); break;
            case 'find':       this._showFindDialog(); break;
            case 'about':      this._showAbout(); break;
            default: Utils.Logger.log('[Notepad] Unknown action:', action);
        }
    }

    // ─── File Operations ──────────────────────────────────────────────────────

    private _newFile(): void {
        if (this.isModified) {
            // Use retro-style confirm via window confirm (OK for system dialogs)
            if (!confirm(`Save changes to ${this.currentFile}?`)) {
                // Discard
            } else {
                this._saveFile();
                return;
            }
        }
        if (this.textarea) this.textarea.value = '';
        this.currentFile = 'Untitled';
        this.currentPath = VFS_SAVE_DIR;
        this.isModified = false;
        this._lastFindIndex = -1;
        this.updateTitle();
        this._updateStatus();
    }

    /** Save to VFS. If filename is 'Untitled', show Save As dialog first. */
    private _saveFile(): void {
        if (this.currentFile === 'Untitled') {
            this._showSaveAsDialog();
            return;
        }
        this._writeToVFS(this.currentPath, this.currentFile);
    }

    private _writeToVFS(dir: string, name: string): void {
        if (!this.textarea) return;

        // Ensure the name ends in .txt
        const safeName = name.endsWith('.txt') ? name : name + '.txt';
        const content = this.textarea.value;

        const ok = VFS.writeFile(dir, safeName, content);
        const notify = Services.get('Notify') as INotify | undefined;

        if (ok) {
            this.currentFile = safeName;
            this.currentPath = dir;
            this.isModified = false;
            this.updateTitle();
            if (notify) notify.success(`Saved: ${dir}\\${safeName}`);
            Utils.Logger.log(`[Notepad] Saved to VFS: ${dir}\\${safeName}`);
        } else {
            if (notify) notify.warn(`Could not save: ${safeName}`);
            Utils.Logger.warn(`[Notepad] VFS write failed: ${dir}\\${safeName}`);
        }
    }

    // ─── Open Dialog ──────────────────────────────────────────────────────────

    private _showOpenDialog(): void {
        const dialog = document.getElementById('notepad-open-dialog');
        const input = document.getElementById('notepad-open-input') as HTMLInputElement;
        const fileList = document.getElementById('notepad-dialog-filelist');
        if (!dialog) return;

        // Populate file list from VFS DOCUMENTS
        if (fileList) {
            fileList.innerHTML = '';
            const files = VFS.listDir(VFS_SAVE_DIR) || [];
            files
                .filter(f => f.toLowerCase().endsWith('.txt'))
                .forEach(fname => {
                    const entry = document.createElement('div');
                    entry.className = 'notepad-dialog-file-entry';
                    entry.textContent = fname;
                    entry.addEventListener('click', () => {
                        if (input) input.value = fname;
                    });
                    entry.addEventListener('dblclick', () => {
                        if (input) input.value = fname;
                        this._confirmOpen();
                    });
                    fileList.appendChild(entry);
                });

            if (fileList.children.length === 0) {
                fileList.innerHTML = '<div style="padding:4px;color:#808080;font-size:10px;">(no .txt files)</div>';
            }
        }

        if (input) input.value = '';
        dialog.style.display = 'block';
        if (input) setTimeout(() => input.focus(), 50);
    }

    private _confirmOpen(): void {
        const input = document.getElementById('notepad-open-input') as HTMLInputElement;
        const name = input?.value?.trim();
        if (!name) return;

        const safeName = name.endsWith('.txt') ? name : name + '.txt';
        const fullPath = `${VFS_SAVE_DIR}\\${safeName}`;
        const content = VFS.readFile(fullPath);

        const notify = Services.get('Notify') as INotify | undefined;

        if (content !== null) {
            if (this.textarea) this.textarea.value = content;
            this.currentFile = safeName;
            this.currentPath = VFS_SAVE_DIR;
            this.isModified = false;
            this._lastFindIndex = -1;
            this.updateTitle();
            this._updateStatus();
            this._hideDialog('notepad-open-dialog');
            Utils.Logger.log(`[Notepad] Opened from VFS: ${fullPath}`);
        } else {
            if (notify) notify.warn(`File not found: ${safeName}`);
            else Utils.Logger.warn(`[Notepad] File not found: ${fullPath}`);
        }
    }

    // ─── Save As Dialog ───────────────────────────────────────────────────────

    private _showSaveAsDialog(): void {
        const dialog = document.getElementById('notepad-saveas-dialog');
        const input = document.getElementById('notepad-saveas-input') as HTMLInputElement;
        if (!dialog) return;

        if (input) {
            input.value = this.currentFile === 'Untitled' ? '' : this.currentFile.replace(/\.txt$/, '');
        }
        dialog.style.display = 'block';
        if (input) setTimeout(() => { input.focus(); input.select(); }, 50);
    }

    private _confirmSaveAs(): void {
        const input = document.getElementById('notepad-saveas-input') as HTMLInputElement;
        const name = input?.value?.trim();
        if (!name) return;

        this._hideDialog('notepad-saveas-dialog');
        this._writeToVFS(VFS_SAVE_DIR, name);
    }

    // ─── Find Dialog ──────────────────────────────────────────────────────────

    private _showFindDialog(): void {
        const dialog = document.getElementById('notepad-find-dialog');
        const input = document.getElementById('notepad-find-input') as HTMLInputElement;
        if (!dialog) return;

        if (input && this._lastFindTerm) input.value = this._lastFindTerm;
        dialog.style.display = 'block';
        if (input) setTimeout(() => { input.focus(); input.select(); }, 50);
    }

    private _findNext(): void {
        const input = document.getElementById('notepad-find-input') as HTMLInputElement;
        const term = input?.value?.trim();
        if (!term || !this.textarea) return;

        const text = this.textarea.value.toLowerCase();
        const search = term.toLowerCase();

        // If term changed, reset
        if (term !== this._lastFindTerm) {
            this._lastFindTerm = term;
            this._lastFindIndex = -1;
        }

        const startFrom = this._lastFindIndex + 1;
        const idx = text.indexOf(search, startFrom);

        if (idx !== -1) {
            this.textarea.focus();
            this.textarea.setSelectionRange(idx, idx + term.length);
            this._lastFindIndex = idx;

            // Scroll into view
            const linesBefore = text.substring(0, idx).split('\n').length;
            const lineHeight = parseInt(getComputedStyle(this.textarea).lineHeight) || 16;
            this.textarea.scrollTop = (linesBefore - 2) * lineHeight;
        } else {
            // Wrap around
            this._lastFindIndex = -1;
            const notify = Services.get('Notify') as INotify | undefined;
            if (notify) notify.info(`Cannot find "${term}". Wrapped to top.`);
        }
    }

    // ─── Dialog helpers ───────────────────────────────────────────────────────

    private _hideDialog(id: string): void {
        const dialog = document.getElementById(id);
        if (dialog) dialog.style.display = 'none';
    }

    // ─── About ────────────────────────────────────────────────────────────────

    private _showAbout(): void {
        const notify = Services.get('Notify') as INotify | undefined;
        const msg = 'Notepad v5.0 — Windows App Center';
        if (notify) notify.info(msg);
        else Utils.Logger.log('[Notepad]', msg);
    }

    // ─── Exit ────────────────────────────────────────────────────────────────

    private _exitApp(): void {
        if (this.isModified && !confirm(`Save changes to ${this.currentFile}?`)) {
            // Discard — fall through to close
        } else if (this.isModified) {
            this._saveFile();
            return; // saveFile may show dialog — close will happen after save
        }
        const wm = Services.get('WindowManager') as IWindowManager | undefined;
        if (wm) wm.close(this.windowId);
        else WindowManager.close(this.windowId);
    }

    // ─── Title ────────────────────────────────────────────────────────────────

    private updateTitle(): void {
        const titleSpan = document.querySelector(`#${this.windowId} .window-header span`);
        if (titleSpan) {
            titleSpan.textContent = `${this.isModified ? '*' : ''}${this.currentFile} - Notepad`;
        }
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    public terminate(): void {
        this._closeAllDropdowns();
        // Hide all dialogs
        ['notepad-open-dialog', 'notepad-saveas-dialog', 'notepad-find-dialog']
            .forEach(id => this._hideDialog(id));

        this._cleanups.forEach(fn => fn());
        this._cleanups = [];
        this.textarea = null;
        Utils.Logger.log('[Notepad] Terminated — all listeners removed');
    }
}

// Register with Kernel
Kernel.registerApp('notepad', Notepad, {
    name: 'Notepad',
    icon: '📝',
    description: 'Simple text editor'
});

export { Notepad };
