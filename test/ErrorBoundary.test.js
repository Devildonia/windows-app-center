/**
 * TESTS: ErrorBoundary
 * Sprint 2 — covers the global JS error → BSOD pipeline
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ─── DOM Setup ────────────────────────────────────────────────────────────────

function setupBSODDom() {
    document.body.innerHTML = `
        <div id="bsod-screen" style="display:none;">
            <div id="bsod-content"></div>
        </div>
    `;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ErrorBoundary — showBSOD()', () => {
    let showBSOD;

    beforeEach(async () => {
        vi.resetModules();
        setupBSODDom();

        const mod = await import('../js/core/ErrorBoundary.js');
        showBSOD = mod.showBSOD;

        // Reset internal _activated flag by re-importing fresh module
    });

    it('shows the bsod-screen element', () => {
        showBSOD('Test error', 'test.js', 42, '');
        const screen = document.getElementById('bsod-screen');
        expect(screen.style.display).toBe('flex');
    });

    it('populates bsod-content with the error message', () => {
        showBSOD('Something went wrong', 'app.js', 100, '');
        const content = document.getElementById('bsod-content');
        expect(content.innerHTML).toContain('Something went wrong');
    });

    it('includes source and line in the BSOD content', () => {
        showBSOD('Crash!', 'module.js', 77, '');
        const content = document.getElementById('bsod-content');
        expect(content.innerHTML).toContain('module.js');
        expect(content.innerHTML).toContain('77');
    });

    it('XSS-sanitizes message, source and line', () => {
        showBSOD('<script>alert(1)</script>', '<evil>', '<line>', '');
        const content = document.getElementById('bsod-content');
        expect(content.innerHTML).not.toContain('<script>');
        expect(content.innerHTML).toContain('&lt;script&gt;');
    });

    it('handles missing BSOD DOM gracefully (no throw)', async () => {
        document.body.innerHTML = '';  // remove BSOD elements
        vi.resetModules();
        const mod = await import('../js/core/ErrorBoundary.js');
        expect(() => mod.showBSOD('error', 'f.js', 1)).not.toThrow();
    });
});

describe('ErrorBoundary — initErrorBoundary()', () => {
    it('attaches error and unhandledrejection listeners', async () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        vi.resetModules();
        const mod = await import('../js/core/ErrorBoundary.js');
        mod.initErrorBoundary();

        const events = addSpy.mock.calls.map(c => c[0]);
        expect(events).toContain('error');
        expect(events).toContain('unhandledrejection');
    });
});
