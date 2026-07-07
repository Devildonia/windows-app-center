/**
 * WINDOWS 95 APP CENTER - i18n (Internationalization)
 * Lightweight translation system with runtime language switching.
 * v1.1 (TypeScript)
 */

import { Utils } from '../utils';
import { Services } from '../core/ServiceContainer';

// ============================================
// TRANSLATION DICTIONARIES
// ============================================

export interface ITranslationDict {
    [key: string]: string;
}

export interface ITranslations {
    [lang: string]: ITranslationDict;
}

const translations: ITranslations = {
    en: {
        // Boot
        'boot.bios_title': 'AMIBIOS (C) 1995 American Megatrends, Inc.',
        'boot.cpu': 'CPU: Intel Pentium(R) 133 MHz',
        'boot.memory': 'Memory Test: {kb}KB OK',
        'boot.keyboard': 'Keyboard... Detected',
        'boot.mouse': 'Mouse... Detected',
        'boot.starting': 'Starting Windows 95...',
        'boot.press_del': 'Press DEL to enter SETUP, ESC to skip POST',

        // Desktop icons
        'app.mycomputer': 'My Computer',
        'app.recyclebin': 'Recycle Bin',
        'app.notepad': 'Notepad',
        'app.paint': 'Paint',
        'app.explorer': 'Explorer',
        'app.internet': 'Internet Explorer',
        'app.display': 'Display',
        'app.ragdoll_workshop': 'Ragdoll Workshop',
        'app.winamp': 'Winamp',
        'app.games': 'Games',

        // Start menu
        'menu.programs': 'Programs',
        'menu.display': 'Display...',
        'menu.shutdown': 'Shut Down...',

        // Dialogs
        'dialog.ok': 'OK',
        'dialog.cancel': 'Cancel',
        'dialog.yes': 'Yes',
        'dialog.no': 'No',
        'dialog.save': 'Save',
        'dialog.close': 'Close',
        'dialog.browse': 'Browse...',
        'dialog.default_shader': 'Default Shader',

        // Notepad
        'notepad.untitled': 'Untitled',
        'notepad.save_changes': 'Do you want to save changes?',
        'notepad.file_not_found': 'File not found',
        'notepad.write_first': 'Write some text first!',
        'notepad.file_prompt': 'File name:',
        'notepad.open_prompt': 'Enter file name to open:',

        // Paint
        'paint.title': 'Paint',
        'paint.pencil': 'Pencil',
        'paint.brush': 'Brush',
        'paint.eraser': 'Eraser',
        'paint.rectangle': 'Rectangle',
        'paint.line': 'Line',
        'paint.clear': 'Clear',
        'paint.undo': 'Undo',
        'paint.redo': 'Redo',

        // System
        'system.shutdown_title': 'Shut Down Windows',
        'system.reset_confirm': 'Are you sure? This will delete all settings and restart the system.',

        // Notifications
        'notify.wallpaper_changed': 'Wallpaper changed',
        'notify.settings_saved': 'Settings saved',
        'notify.file_saved': 'File saved: {name}',
        'notify.file_too_large': 'File is too large! Please choose an image under 2MB.',
        'notify.storage_error': 'Could not save. Storage may be full.',
        'notify.offline': 'You are offline. Some features may not work.',
        'notify.update_available': 'A new version is available. Refresh to update.'
    },

    es: {
        // Boot
        'boot.bios_title': 'AMIBIOS (C) 1995 American Megatrends, Inc.',
        'boot.cpu': 'CPU: Intel Pentium(R) 133 MHz',
        'boot.memory': 'Prueba de memoria: {kb}KB OK',
        'boot.keyboard': 'Teclado... Detectado',
        'boot.mouse': 'Ratón... Detectado',
        'boot.starting': 'Iniciando Windows 95...',
        'boot.press_del': 'Pulse DEL para SETUP, ESC para saltar POST',

        // Desktop icons
        'app.mycomputer': 'Mi PC',
        'app.recyclebin': 'Papelera de Reciclaje',
        'app.notepad': 'Bloc de Notas',
        'app.paint': 'Paint',
        'app.explorer': 'Explorador',
        'app.internet': 'Internet Explorer',
        'app.display': 'Pantalla',
        'app.ragdoll_workshop': 'Taller Ragdoll',
        'app.winamp': 'Winamp',
        'app.games': 'Juegos',

        // Start menu
        'menu.programs': 'Programas',
        'menu.display': 'Pantalla...',
        'menu.shutdown': 'Apagar...',

        // Dialogs
        'dialog.ok': 'Aceptar',
        'dialog.cancel': 'Cancelar',
        'dialog.yes': 'Sí',
        'dialog.no': 'No',
        'dialog.save': 'Guardar',
        'dialog.close': 'Cerrar',
        'dialog.browse': 'Examinar...',
        'dialog.default_shader': 'Shader por defecto',

        // Notepad
        'notepad.untitled': 'Sin título',
        'notepad.save_changes': '¿Desea guardar los cambios?',
        'notepad.file_not_found': 'Archivo no encontrado',
        'notepad.write_first': '¡Escribe algo primero!',
        'notepad.file_prompt': 'Nombre del archivo:',
        'notepad.open_prompt': 'Ingresa el nombre del archivo a abrir:',

        // Paint
        'paint.title': 'Paint',
        'paint.pencil': 'Lápiz',
        'paint.brush': 'Pincel',
        'paint.eraser': 'Borrador',
        'paint.rectangle': 'Rectángulo',
        'paint.line': 'Línea',
        'paint.clear': 'Limpiar',
        'paint.undo': 'Deshacer',
        'paint.redo': 'Rehacer',

        // System
        'system.shutdown_title': 'Apagar Windows',
        'system.reset_confirm': '¿Estás seguro? Esto borrará toda la configuración y reiniciará el sistema.',

        // Notifications
        'notify.wallpaper_changed': 'Fondo de pantalla cambiado',
        'notify.settings_saved': 'Configuración guardada',
        'notify.file_saved': 'Archivo guardado: {name}',
        'notify.file_too_large': '¡Archivo muy grande! Elige una imagen de menos de 2MB.',
        'notify.storage_error': 'No se pudo guardar. El almacenamiento puede estar lleno.',
        'notify.offline': 'Sin conexión. Algunas funciones podrían no funcionar.',
        'notify.update_available': 'Nueva versión disponible. Recarga para actualizar.'
    }
};

// ============================================
// i18n ENGINE
// ============================================

export interface ITranslationService {
    t(key: string, params?: Record<string, any>): string;
    getLang(): string;
    setLang(lang: string): void;
    updateDOM(): void;
    getAvailable(): string[];
    init(): void;
}

let currentLang: string = 'en';

const i18n: ITranslationService = {
    /**
     * Translate a key, with optional interpolation
     */
    t(key: string, params: Record<string, any> = {}): string {
        const dict = translations[currentLang] || translations.en || {};
        const enDict = translations.en || {};
        let text = dict[key] ?? enDict[key] ?? key;

        // Interpolate {param} placeholders
        if (params && typeof text === 'string') {
            Object.keys(params).forEach(k => {
                text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(params[k]));
            });
        }

        return text;
    },

    /**
     * Get current language code
     */
    getLang(): string {
        return currentLang;
    },

    /**
     * Switch language and update all data-i18n elements
     */
    setLang(lang: string): void {
        if (!translations[lang]) {
            Utils.Logger.warn(`[i18n] Unknown language: ${lang}, falling back to 'en'`);
            lang = 'en';
        }

        currentLang = lang;
        Utils.setStorage('win95-lang', lang);

        if (window.state) window.state.lang = lang;

        // Update all DOM elements with data-i18n attribute
        this.updateDOM();

        Utils.Logger.log(`[i18n] Language set to: ${lang}`);
    },

    /**
     * Update all elements with data-i18n in the DOM
     */
    updateDOM(): void {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const htmlEl = el as HTMLElement;
            const key = htmlEl.dataset.i18n;
            if (!key) return;

            const text = this.t(key);
            if (htmlEl.tagName === 'INPUT' && (htmlEl as HTMLInputElement).type !== 'submit') {
                (htmlEl as HTMLInputElement).placeholder = text;
            } else {
                htmlEl.textContent = text;
            }
        });
    },

    /**
     * Get list of available languages
     */
    getAvailable(): string[] {
        return Object.keys(translations);
    },

    /**
     * Initialize — restore saved language
     */
    init(): void {
        const saved = Utils.getStorage<string>('win95-lang', null);
        if (saved && translations[saved]) {
            currentLang = saved;
        } else {
            // Auto-detect from browser
            const browserLang = (navigator.language || 'en').split('-')[0] || 'en';
            currentLang = translations[browserLang] ? browserLang : 'en';
        }

        if (window.state) window.state.lang = currentLang;
        Utils.Logger.log(`[i18n] Initialized with lang: ${currentLang}`);
    }
};

export { i18n };

if (typeof window !== 'undefined') {
    Services.register('i18n', i18n);
}
