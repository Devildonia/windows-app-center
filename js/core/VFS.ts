/**
 * WINDOWS 95 APP CENTER - VFS (Virtual File System)
 * Hierarchical data management with localStorage persistence
 * Version: 3.1 (ES Modules)
 */

import { Utils } from '../utils';
import { Services } from './ServiceContainer';

export interface IVFSNode {
    name: string;
    type: 'dir' | 'file' | 'shortcut';
    children?: Record<string, IVFSNode>;
    content?: string;
    icon?: string;
    actionType?: string;
    actionTarget?: string;
}

export interface IVFS {
    init(): void;
    resolve(path: string): IVFSNode | null;
    mkdir(path: string, name: string): boolean;
    writeFile(path: string, name: string, content: string): boolean;
    readFile(path: string): string | null;
    deleteNode(parentPath: string, name: string): boolean;
    rename(parentPath: string, oldName: string, newName: string): boolean;
    listDir(path: string): string[] | null;
    getRoot(): IVFSNode | null;
    __reset(): void;
}

export const VFS: IVFS = (() => {
    'use strict';

    const STORAGE_KEY = 'win95_vfs_root';

    // Default initial FS
    const DEFAULT_FS: IVFSNode = {
        name: 'C:',
        type: 'dir',
        children: {
            'WINDOWS': {
                name: 'WINDOWS', type: 'dir', children: {
                    'SYSTEM': { name: 'SYSTEM', type: 'dir', children: {} }
                }
            },
            'DOCUMENTS': {
                name: 'DOCUMENTS', type: 'dir', children: {
                    'README.txt': { name: 'README.txt', type: 'file', content: 'Welcome to Windows App Center v1.6.0' }
                }
            },
            'GAMES': {
                name: 'GAMES',
                type: 'dir',
                children: {
                    'Virtual Life Restart Simulator': { name: 'Virtual Life Restart Simulator', type: 'dir', children: {}, actionType: 'openWindow', actionTarget: 'win-vlrs-folder' },
                    'Flappy Neon': { name: 'Flappy Neon', type: 'dir', children: {}, actionType: 'openWindow', actionTarget: 'win-flappy-folder' },
                    'Football Rush': {
                        name: 'Football Rush',
                        type: 'dir',
                        children: {
                            'README.TXT': { name: 'README.TXT', type: 'file', content: 'FOOTBALL RUSH\n\nA high-speed football game for Windows 95.\nUse ARROW KEYS to move and SPACE to kick.\n\nGood luck!' }
                        },
                        actionType: 'openWindow',
                        actionTarget: 'win-football-folder'
                    }
                }
            },
            'DESKTOP': {
                name: 'DESKTOP',
                type: 'dir',
                children: {
                    'My Computer': { name: 'My Computer', type: 'shortcut', icon: '💻', actionType: 'openDialog', actionTarget: 'dialog-mycomputer' },
                    'Recycle Bin': { name: 'Recycle Bin', type: 'shortcut', icon: '🗑️', actionType: 'openDialog', actionTarget: 'dialog-recyclebin' },
                    'Games': { name: 'Games', type: 'shortcut', icon: '📂', actionType: 'openWindow', actionTarget: 'win-games-folder' },
                    'Notepad': { name: 'Notepad', type: 'shortcut', icon: '📝', actionType: 'launch', actionTarget: 'notepad' },
                    'Paint': { name: 'Paint', type: 'shortcut', icon: '🎨', actionType: 'launch', actionTarget: 'paint' },
                    'Explorer': { name: 'Explorer', type: 'shortcut', icon: '🗂️', actionType: 'launch', actionTarget: 'explorer' }
                }
            }
        }
    };

    let root: IVFSNode | null = null;

    function cloneDefaultFS(): IVFSNode {
        return structuredClone(DEFAULT_FS);
    }

    function init(): void {
        const saved = localStorage.getItem(STORAGE_KEY);
        let needsReset = false;

        if (saved) {
            try {
                root = JSON.parse(saved);

                // v1.0.7.5: Check if GAMES and DESKTOP are properly populated
                const gamesFolder = root?.children ? root.children['GAMES'] : null;
                const desktopFolder = root?.children ? root.children['DESKTOP'] : null;

                if (!gamesFolder || !gamesFolder.children || Object.keys(gamesFolder.children).length === 0) {
                    Utils.Logger.log('VFS: GAMES folder empty, resetting...');
                    needsReset = true;
                }

                if (!desktopFolder || !desktopFolder.children || Object.keys(desktopFolder.children).length === 0) {
                    Utils.Logger.log('VFS: DESKTOP folder empty, resetting...');
                    needsReset = true;
                }
            } catch (e) {
                Utils.Logger.error('VFS: Corrupted storage, resetting...');
                needsReset = true;
            }
        } else {
            needsReset = true;
        }

        if (needsReset) {
            root = cloneDefaultFS();
            save();
        }

        Utils.Logger.log('VFS: Initialized');
    }

    function save(): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
    }

    /**
     * Resolves a path string to a VFS node
     * @param {string} path - Absolute path (e.g. "C:\WINDOWS\SYSTEM")
     */
    function resolve(path: string): IVFSNode | null {
        if (!path || path === 'C:' || path === 'C:\\') return root;

        const parts = path.replace('C:', '').split(/[/\\]/).filter(p => p !== '');
        let current = root;

        for (const part of parts) {
            if (current && current.children && current.children[part]) {
                current = current.children[part];
            } else {
                return null;
            }
        }
        return current;
    }

    function mkdir(path: string, name: string): boolean {
        const safeName = (typeof Utils !== 'undefined' && Utils.sanitizePath)
            ? Utils.sanitizePath(name) : name;
        if (!safeName) return false;
        const parent = resolve(path);
        if (parent && parent.type === 'dir' && parent.children) {
            parent.children[safeName] = { name: safeName, type: 'dir', children: {} };
            save();
            return true;
        }
        return false;
    }

    function writeFile(path: string, name: string, content: string): boolean {
        const safeName = (typeof Utils !== 'undefined' && Utils.sanitizePath)
            ? Utils.sanitizePath(name) : name;
        if (!safeName) return false;
        const parent = resolve(path);
        if (parent && parent.type === 'dir' && parent.children) {
            parent.children[safeName] = { name: safeName, type: 'file', content };
            save();
            return true;
        }
        return false;
    }

    function readFile(path: string): string | null {
        const node = resolve(path);
        return (node && node.type === 'file') ? (node.content ?? '') : null;
    }

    function deleteNode(parentPath: string, name: string): boolean {
        const parent = resolve(parentPath);
        if (parent && parent.type === 'dir' && parent.children && parent.children[name]) {
            delete parent.children[name];
            save();
            return true;
        }
        return false;
    }

    function rename(parentPath: string, oldName: string, newName: string): boolean {
        const parent = resolve(parentPath);
        if (!parent || parent.type !== 'dir' || !parent.children || !parent.children[oldName]) return false;
        if (parent.children[newName]) return false; // Name already taken

        const node = parent.children[oldName];
        node.name = newName;
        parent.children[newName] = node;
        delete parent.children[oldName];
        save();
        return true;
    }

    function listDir(path: string): string[] | null {
        const node = resolve(path);
        if (node && node.type === 'dir' && node.children) {
            return Object.keys(node.children);
        }
        return null;
    }

    return {
        init,
        resolve,
        mkdir,
        writeFile,
        readFile,
        deleteNode,
        rename,
        listDir,
        getRoot: () => root,
        __reset: () => { root = null; }
    };
})();

if (typeof window !== 'undefined') {
    (window as any).VFS = VFS;
    Services.register('VFS', VFS);
}
