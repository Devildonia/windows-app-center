import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VFS } from '../js/core/VFS.js';

describe('VFS (Virtual File System)', () => {
    beforeEach(() => {
        // Clear localStorage and reset VFS before each test
        localStorage.clear();
        vi.resetAllMocks();
        VFS.__reset();

        // VFS state is internal to the module, but init() resets it based on localStorage
        VFS.init();
    });

    it('should initialize with default structure if storage is empty', () => {
        const root = VFS.getRoot();
        expect(root).toBeDefined();
        expect(root.name).toBe('C:');
        expect(root.children.WINDOWS).toBeDefined();
    });

    it('should resolve absolute paths correctly', () => {
        const windowsNode = VFS.resolve('C:\\WINDOWS');
        expect(windowsNode).toBeDefined();
        expect(windowsNode.name).toBe('WINDOWS');

        const systemNode = VFS.resolve('C:\\WINDOWS\\SYSTEM');
        expect(systemNode).toBeDefined();
        expect(systemNode.name).toBe('SYSTEM');
    });

    it('should return null for non-existent paths', () => {
        const invalidNode = VFS.resolve('C:\\NON_EXISTENT');
        expect(invalidNode).toBeNull();
    });

    it('should be able to create directories', () => {
        const success = VFS.mkdir('C:\\WINDOWS', 'TEMP');
        expect(success).toBe(true);

        const tempNode = VFS.resolve('C:\\WINDOWS\\TEMP');
        expect(tempNode).toBeDefined();
        expect(tempNode.type).toBe('dir');
    });

    it('should be able to write and read files', () => {
        const success = VFS.writeFile('C:\\DOCUMENTS', 'test.txt', 'Hello Vitest');
        expect(success).toBe(true);

        const content = VFS.readFile('C:\\DOCUMENTS\\test.txt');
        expect(content).toBe('Hello Vitest');
    });

    it('should persist data to localStorage', () => {
        VFS.mkdir('C:\\', 'PERSISTENT');

        // Re-initialize VFS
        VFS.init();
        const persistentNode = VFS.resolve('C:\\PERSISTENT');
        expect(persistentNode).toBeDefined();
    });
});
