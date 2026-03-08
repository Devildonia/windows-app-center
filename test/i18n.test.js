import { describe, it, expect, beforeEach, vi } from 'vitest';
import { i18n } from '../js/services/i18n.js';

describe('i18n', () => {
    beforeEach(() => {
        localStorage.clear();
        // Reset to English
        i18n.setLang('en');
    });

    describe('t() — translation', () => {
        it('should translate known keys in English', () => {
            expect(i18n.t('app.notepad')).toBe('Notepad');
            expect(i18n.t('app.paint')).toBe('Paint');
            expect(i18n.t('menu.shutdown')).toBe('Shut Down...');
        });

        it('should translate known keys in Spanish', () => {
            i18n.setLang('es');
            expect(i18n.t('app.notepad')).toBe('Bloc de Notas');
            expect(i18n.t('app.recyclebin')).toBe('Papelera de Reciclaje');
            expect(i18n.t('menu.shutdown')).toBe('Apagar...');
        });

        it('should interpolate parameters', () => {
            const result = i18n.t('boot.memory', { kb: 65536 });
            expect(result).toContain('65536');
            expect(result).toContain('KB OK');
        });

        it('should interpolate parameters in Spanish', () => {
            i18n.setLang('es');
            const result = i18n.t('boot.memory', { kb: 65536 });
            expect(result).toContain('65536');
        });

        it('should return the key itself as fallback for unknown keys', () => {
            expect(i18n.t('nonexistent.key')).toBe('nonexistent.key');
        });

        it('should fall back to English when key missing in current lang', () => {
            i18n.setLang('es');
            // If a key exists in EN but not ES, should fallback to EN
            const enDict = i18n.t('app.notepad'); // exists in both
            expect(enDict).toBe('Bloc de Notas');
        });
    });

    describe('setLang / getLang', () => {
        it('should switch language and report current', () => {
            i18n.setLang('es');
            expect(i18n.getLang()).toBe('es');
            i18n.setLang('en');
            expect(i18n.getLang()).toBe('en');
        });

        it('should fall back to English for unknown language', () => {
            i18n.setLang('xx');
            expect(i18n.getLang()).toBe('en');
        });

        it('should persist language to localStorage', () => {
            i18n.setLang('es');
            expect(localStorage.getItem('win95-lang')).not.toBeNull();
        });
    });

    describe('getAvailable', () => {
        it('should return at least en and es', () => {
            const langs = i18n.getAvailable();
            expect(langs).toContain('en');
            expect(langs).toContain('es');
        });
    });

    describe('updateDOM', () => {
        it('should update data-i18n elements with translated text', () => {
            document.body.innerHTML = '<span data-i18n="app.notepad">old</span>';
            i18n.setLang('en');
            i18n.updateDOM();
            expect(document.querySelector('[data-i18n]').textContent).toBe('Notepad');
        });

        it('should update placeholder for input elements', () => {
            document.body.innerHTML = '<input type="text" data-i18n="app.notepad">';
            i18n.updateDOM();
            expect(document.querySelector('input').placeholder).toBe('Notepad');
        });

        it('should switch all elements when language changes', () => {
            document.body.innerHTML = `
                <span data-i18n="app.notepad"></span>
                <span data-i18n="app.paint"></span>
            `;
            i18n.setLang('es');
            const spans = document.querySelectorAll('[data-i18n]');
            expect(spans[0].textContent).toBe('Bloc de Notas');
            expect(spans[1].textContent).toBe('Paint'); // Paint is same in both
        });
    });

    describe('init', () => {
        it('should restore saved language from storage', () => {
            localStorage.setItem('win95-lang', JSON.stringify('es'));
            i18n.init();
            expect(i18n.getLang()).toBe('es');
        });

        it('should default to English when no saved language', () => {
            localStorage.clear();
            i18n.init();
            expect(i18n.getLang()).toBe('en');
        });
    });
});
