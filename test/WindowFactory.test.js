import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WindowFactory } from '../js/ui/WindowFactory.js';

describe('WindowFactory', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="desktop"></div>';
        vi.resetAllMocks();
        WindowFactory.__reset();

        // Mock global dependencies
        global.WindowManager = {
            makeDraggable: vi.fn(),
            open: vi.fn()
        };
    });

    it('should create a window with correct structure', () => {
        const id = WindowFactory.create({
            title: 'Test Window',
            body: '<p>Content</p>'
        });

        const win = document.getElementById(id);
        expect(win).not.toBeNull();
        expect(win.classList.contains('win95-window')).toBe(true);
        expect(win.querySelector('.window-header span').textContent).toBe('Test Window');
        expect(win.querySelector('.window-body').innerHTML).toBe('<p>Content</p>');
    });

    it('should not create duplicate windows by ID', () => {
        const id1 = WindowFactory.create({ id: 'unique-win', title: 'First' });
        const id2 = WindowFactory.create({ id: 'unique-win', title: 'Second' });

        expect(id1).toBe(id2);
        const windows = document.querySelectorAll('.win95-window');
        expect(windows.length).toBe(1);
    });

    it('should create game windows with lazy loading attributes', () => {
        const id = WindowFactory.createGameWindow({
            id: 'my-game',
            src: 'game.html'
        });

        const win = document.getElementById(id);
        const iframe = win.querySelector('iframe');
        expect(iframe).not.toBeNull();
        expect(iframe.getAttribute('loading')).toBe('lazy');
        expect(iframe.getAttribute('data-src')).toBe('game.html');
        expect(iframe.src).toBe(''); // Should be empty initially (lazy)
    });

    it('should destroy windows correctly', () => {
        const id = WindowFactory.create({ title: 'Kill Me' });
        expect(document.getElementById(id)).not.toBeNull();

        WindowFactory.destroy(id);
        expect(document.getElementById(id)).toBeNull();
    });

    it('should update window title', () => {
        const id = WindowFactory.create({ title: 'Old Title' });
        WindowFactory.setTitle(id, 'New Title');

        const span = document.querySelector('.window-header span');
        expect(span.textContent).toBe('New Title');
    });
});
