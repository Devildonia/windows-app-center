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

export const translations = {
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
        'notify.update_available': 'A new version is available. Refresh to update.',

        // Apps & System
        'app.taskmanager': 'Task Manager',
        'app.terminal': 'MS-DOS Prompt',
        'app.pluginmanager': 'Plugin Manager',
        'taskmanager.processes': 'Processes',
        'taskmanager.performance': 'Performance',
        'taskmanager.system': 'System',
        'taskmanager.endtask': 'End Task',
        'pluginmanager.install': 'Install',
        'pluginmanager.uninstall': 'Uninstall',
        'pluginmanager.coreapp': 'core app',

        // Settings
        'app.settings': 'Settings',
        'settings.title': 'Settings',
        'settings.nav_language': 'Language & Region',
        'settings.language_label': 'Display language',
        'settings.language_desc': 'Select the language for menus, dialogs and apps.',
        'settings.applied': 'Language applied',
        'settings.more_soon': 'More settings coming soon.',

        // Desktop Icons and UI extensions
        'app.games_folder': 'Games',
        'app.ragdoll_skins': 'Ragdoll Workshop',
        'menu.programs_header': '📁 Programs ▸',
        'menu.settings': '⚙️ Settings',
        'menu.shutdown_btn': '🔴 Shut Down...',
        'folder.back': '⬅ Back',
        'folder.address': 'Address:',
        'folder.menu': '📁 File 📝 Edit 👁️ View ❓ Help',

        // Sticky Notes
        'sticky.welcome_win95': 'Welcome to Windows App Center v1.6.3!',
        'sticky.welcome_modern': 'Welcome to Windows UI App Center v1.6.3!',
        'sticky.games_hint': 'Check out the Games folder to get started.',
        'sticky.admin': '- Admin',
        'sticky.ragdoll_hint': 'Please be kind to the ragdoll pet.',

        // Game Readmes
        'readme.vlrs': 'VIRTUAL LIFE RESTART SIMULATOR\n================================\n\nTake control of a new life! Make choices, manage your stats, and see where your decisions take you.\n\nInstructions:\n- Use the mouse to interact with the UI.\n- Make decisions carefully!\n- Manage your health, wealth, and happiness.',
        'readme.flappy': 'FLAPPY NEON\n===========\n\nNavigate the neon bird through the pipes!\n\nInstructions:\n- Press SPACE or Click to jump.\n- Avoid the pipes.\n- Get the highest score!',
        'readme.football': 'FOOTBALL RUSH\n=============\n\nRun, dodge, and score!\n\nInstructions:\n- Use arrow keys to move.\n- Press SPACE to kick/shoot.',
        'readme.doom': 'DOOM CLASSIC\n============\n\nThe legendary 90s FPS.\n\nInstructions:\n- W/A/S/D to move.\n- Click/Ctrl to shoot.\n- Space to interact.',
        'readme.tetris': 'TETRIS TRYHARD\n==============\n\nPure block-stacking action.\n\nInstructions:\n- Use arrow keys to move/rotate blocks.\n- Space to drop.',
        'readme.chapas': 'CHAPAS PRIME\n============\n\nA 3D physics-based button football game (Chapas).\n\nInstructions:\n- Click and drag on your cap to aim and set power.\n- Release to shoot!\n- Score more goals than your opponent to win.',
        'readme.nocturna': 'NOCTURNA\n========\n\nEl Jardín Silente - A procedural, atmospheric rhythm game.\n\nInstructions:\n- Connect flowing energy nodes matching the beat.\n- Maintain your rhythm flow to blossom the quiet garden.\n- Use keys or tap controls to interact with visual elements.',
        'readme.gameboy': 'H.I.P. GAME BOY EMULATOR\n========================\n\nA fully-featured Game Boy emulator in 3D using Three.js and WebGL.\n\nInstructions:\n- Load ROM files (.gb) directly into the virtual cartridge slot.\n- Use customizable keyboard binds to play GB classics.\n- Modify video/render options in the system preferences panel.',

        // Ragdoll Workshop
        'workshop.tab_skins': 'Skins',
        'workshop.tab_physics': 'Physics',
        'workshop.tab_effects': 'Effects',
        'workshop.tab_test': 'Test',
        'workshop.tab_3dviewer': '3D Viewer',
        'workshop.standard': 'Standard',
        'workshop.custom': 'Custom',
        'workshop.drag_drop': 'Drag & Drop custom images (.png/.webp)',
        'workshop.part_head': 'Head',
        'workshop.part_shirt': 'Shirt',
        'workshop.part_neck': 'Neck',
        'workshop.part_larm': 'L-Arm',
        'workshop.part_rarm': 'R-Arm',
        'workshop.part_lleg': 'L-Leg',
        'workshop.part_rleg': 'R-Leg',
        'workshop.selection': 'Selection:',
        'workshop.none': 'None',
        'workshop.size': 'Size:',
        'workshop.height': 'Height:',
        'workshop.limb_proportions': 'Limb Proportions',
        'workshop.arm_length': 'Arm Length:',
        'workshop.leg_length': 'Leg Length:',
        'workshop.head_scale': 'Head Scale:',
        'workshop.torso_scale': 'Torso Scale:',
        'workshop.visual_novelties': 'Visual Novelties',
        'workshop.soft_joints': 'Organic Soft-Joints',
        'workshop.ground_shadow': 'Ambient Ground Shadow',
        'workshop.limb_tinting': 'Limb Tinting',
        'workshop.emanations': 'Emanations',
        'workshop.fire_trail': 'Fire Trail',
        'workshop.star_aura': 'Star Aura',
        'workshop.vfx_intensity': 'VFX Intensity:',
        'workshop.vfx_size': 'VFX Size:',
        'workshop.manual_control': 'Manual Control',
        'workshop.help_move': 'Move: WASD / Arrows',
        'workshop.help_jump': 'Jump: W / Space | Drop: P',
        'workshop.help_reset': 'Reset: R (Stand up)',
        'workshop.animations': 'Animations',
        'workshop.anim_dance': 'Dance',
        'workshop.anim_moonwalk': 'Moonwalk',
        'workshop.anim_backflip': 'Backflip',
        'workshop.anim_jump': 'Jump',
        'workshop.anim_wave': 'Wave',
        'workshop.anim_sit': 'Sit',
        'workshop.anim_laugh': 'Laugh',
        'workshop.anim_eat': 'Eat',
        'workshop.anim_cry': 'Cry',
        'workshop.anim_sleep': 'Sleep',
        'workshop.emotions': 'Emotions',
        'workshop.emo_happy': 'Happy',
        'workshop.emo_neutral': 'Neutral',
        'workshop.emo_sad': 'Sad',
        'workshop.emo_angry': 'Angry',
        'workshop.emo_panic': 'Panic',
        'workshop.emo_hurt': 'Hurt',
        'workshop.voice_commands': 'Voice Commands',
        'workshop.drag_mouse': 'Drag with the mouse',
        'workshop.reset_pose': '♻️ Reset Pose',
        'workshop.toggle_skeleton': '🛠️ View Skeleton',
        'workshop.booting': 'Booting Simulation...',
        'workshop.scale': 'Scale',
        'workshop.width': 'Width',
        'workshop.reset': 'Reset'
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
        'notify.update_available': 'Nueva versión disponible. Recarga para actualizar.',

        // Apps & System
        'app.taskmanager': 'Administrador de tareas',
        'app.terminal': 'MS-DOS',
        'app.pluginmanager': 'Administrador de extensiones',
        'taskmanager.processes': 'Procesos',
        'taskmanager.performance': 'Rendimiento',
        'taskmanager.system': 'Sistema',
        'taskmanager.endtask': 'Finalizar tarea',
        'pluginmanager.install': 'Instalar',
        'pluginmanager.uninstall': 'Desinstalar',
        'pluginmanager.coreapp': 'app del sistema',

        // Settings
        'app.settings': 'Configuración',
        'settings.title': 'Configuración',
        'settings.nav_language': 'Idioma y región',
        'settings.language_label': 'Idioma de la interfaz',
        'settings.language_desc': 'Elige el idioma de menús, diálogos y aplicaciones.',
        'settings.applied': 'Idioma aplicado',
        'settings.more_soon': 'Más opciones próximamente.',

        // Desktop Icons and UI extensions
        'app.games_folder': 'Juegos',
        'app.ragdoll_skins': 'Taller Ragdoll',
        'menu.programs_header': '📁 Programas ▸',
        'menu.settings': '⚙️ Configuración',
        'menu.shutdown_btn': '🔴 Apagar...',
        'folder.back': '⬅ Atrás',
        'folder.address': 'Dirección:',
        'folder.menu': '📁 Archivo 📝 Edición 👁️ Ver ❓ Ayuda',

        // Sticky Notes
        'sticky.welcome_win95': '¡Bienvenido a Windows App Center v1.6.3!',
        'sticky.welcome_modern': '¡Bienvenido a Windows UI App Center v1.6.3!',
        'sticky.games_hint': 'Echa un vistazo a la carpeta Juegos para empezar.',
        'sticky.admin': '- Adm.',
        'sticky.ragdoll_hint': 'Por favor, sé amable con la mascota ragdoll.',

        // Game Readmes
        'readme.vlrs': 'SIMULADOR DE REINICIO DE VIDA VIRTUAL\n======================================\n\n¡Toma el control de una nueva vida! Toma decisiones, gestiona tus estadísticas y mira a dónde te llevan tus elecciones.\n\nInstrucciones:\n- Usa el ratón para interactuar con la interfaz.\n- ¡Toma decisiones con cuidado!\n- Gestiona tu salud, riqueza y felicidad.',
        'readme.flappy': 'FLAPPY NEON\n===========\n\n¡Guía al pájaro de neón a través de las tuberías!\n\nInstrucciones:\n- Presiona ESPACIO o haz Clic para saltar.\n- Evita las tuberías.\n- ¡Consigue la puntuación más alta!',
        'readme.football': 'FOOTBALL RUSH\n=============\n\n¡Corre, esquiva y marca gol!\n\nInstrucciones:\n- Usa las teclas de flecha para moverte.\n- Presiona ESPACIO para chutar/disparar.',
        'readme.doom': 'DOOM CLÁSICO\n============\n\nEl legendario FPS de los 90.\n\nInstrucciones:\n- W/A/S/D para moverte.\n- Clic/Ctrl para disparar.\n- Espacio para interactuar.',
        'readme.tetris': 'TETRIS TRYHARD\n==============\n\nAcción pura de apilar bloques.\n\nInstrucciones:\n- Usa las teclas de flecha para mover/rotar bloques.\n- Espacio para soltar.',
        'readme.chapas': 'CHAPAS PRIME\n============\n\nUn juego de fútbol de chapa en 3D basado en físicas.\n\nInstrucciones:\n- Haz clic y arrastra sobre tu chapa para apuntar y definir la potencia.\n- ¡Suelta para chutar!\n- ¡Marca más goles que tu oponente para ganar!',
        'readme.nocturna': 'NOCTURNA\n========\n\nEl Jardín Silente - Un juego de ritmo procedural y atmosférico.\n\nInstrucciones:\n- Conecta los nodos de energía que fluyen siguiendo el ritmo.\n- Mantén el ritmo para hacer florecer el silencioso jardín.\n- Usa las teclas o los controles táctiles para interactuar con los elementos visuales.',
        'readme.gameboy': 'EMULADOR H.I.P. GAME BOY\n========================\n\nUn emulador de Game Boy completo en 3D usando Three.js y WebGL.\n\nInstrucciones:\n- Carga archivos ROM (.gb) directamente en la ranura del cartucho virtual.\n- Usa teclas configurables para jugar clásicos de GB.\n- Modifica las opciones de video/renderizado en el panel de preferencias del sistema.',

        // Ragdoll Workshop
        'workshop.tab_skins': 'Skins',
        'workshop.tab_physics': 'Física',
        'workshop.tab_effects': 'Efectos',
        'workshop.tab_test': 'Prueba',
        'workshop.tab_3dviewer': 'Visor 3D',
        'workshop.standard': 'Estándar',
        'workshop.custom': 'Personalizado',
        'workshop.drag_drop': 'Arrastra y suelta imágenes (.png/.webp)',
        'workshop.part_head': 'Cabeza',
        'workshop.part_shirt': 'Camiseta',
        'workshop.part_neck': 'Cuello',
        'workshop.part_larm': 'Brazo-I',
        'workshop.part_rarm': 'Brazo-D',
        'workshop.part_lleg': 'Pierna-I',
        'workshop.part_rleg': 'Pierna-D',
        'workshop.selection': 'Selección:',
        'workshop.none': 'Ninguna',
        'workshop.size': 'Tamaño:',
        'workshop.height': 'Altura:',
        'workshop.limb_proportions': 'Proporciones de miembros',
        'workshop.arm_length': 'Longitud de brazo:',
        'workshop.leg_length': 'Longitud de pierna:',
        'workshop.head_scale': 'Escala de cabeza:',
        'workshop.torso_scale': 'Escala de torso:',
        'workshop.visual_novelties': 'Novedades visuales',
        'workshop.soft_joints': 'Articulaciones orgánicas',
        'workshop.ground_shadow': 'Sombra ambiental en el suelo',
        'workshop.limb_tinting': 'Tinte de miembros',
        'workshop.emanations': 'Emanaciones',
        'workshop.fire_trail': 'Estela de fuego',
        'workshop.star_aura': 'Aura de estrellas',
        'workshop.vfx_intensity': 'Intensidad VFX:',
        'workshop.vfx_size': 'Tamaño VFX:',
        'workshop.manual_control': 'Control manual',
        'workshop.help_move': 'Mover: WASD / Flechas',
        'workshop.help_jump': 'Saltar: W / Espacio | Soltar: P',
        'workshop.help_reset': 'Reiniciar: R (Levantarse)',
        'workshop.animations': 'Animaciones',
        'workshop.anim_dance': 'Bailar',
        'workshop.anim_moonwalk': 'Moonwalk',
        'workshop.anim_backflip': 'Voltereta',
        'workshop.anim_jump': 'Saltar',
        'workshop.anim_wave': 'Saludar',
        'workshop.anim_sit': 'Sentarse',
        'workshop.anim_laugh': 'Reír',
        'workshop.anim_eat': 'Comer',
        'workshop.anim_cry': 'Llorar',
        'workshop.anim_sleep': 'Dormir',
        'workshop.emotions': 'Emociones',
        'workshop.emo_happy': 'Feliz',
        'workshop.emo_neutral': 'Neutral',
        'workshop.emo_sad': 'Triste',
        'workshop.emo_angry': 'Enfadado',
        'workshop.emo_panic': 'Pánico',
        'workshop.emo_hurt': 'Herido',
        'workshop.voice_commands': 'Comandos de voz',
        'workshop.drag_mouse': 'Arrastrar con el ratón',
        'workshop.reset_pose': '♻️ Reiniciar pose',
        'workshop.toggle_skeleton': '🛠️ Ver esqueleto',
        'workshop.booting': 'Iniciando simulación...',
        'workshop.scale': 'Escala',
        'workshop.width': 'Ancho',
        'workshop.reset': 'Reiniciar'
    }
} satisfies ITranslations;

// Canonical key set derived from the English dictionary (single source of truth).
// Using `satisfies` above preserves literal keys so this is a strict union, not `string`.
export type TranslationKey = keyof typeof translations['en'];
type LangCode = keyof typeof translations;

// ============================================
// i18n ENGINE
// ============================================

export interface ITranslationService {
    // `TranslationKey` gives autocomplete/typo-checking for known keys, while
    // `(string & {})` still permits dynamic runtime keys (e.g. notification keys).
    t(key: TranslationKey | (string & {}), params?: Record<string, string | number>): string;
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
    t(key: TranslationKey | (string & {}), params: Record<string, string | number> = {}): string {
        const dict = translations[currentLang as LangCode] || translations.en;
        const enDict = translations.en;
        let text: string = (dict as ITranslationDict)[key] ?? enDict[key as TranslationKey] ?? key;

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
        if (!translations[lang as LangCode]) {
            Utils.Logger.warn(`[i18n] Unknown language: ${lang}, falling back to 'en'`);
            lang = 'en';
        }

        currentLang = lang;
        Utils.setStorage('win95-lang', lang);

        if (window.state) window.state.lang = lang;

        // Update all DOM elements with data-i18n attribute
        this.updateDOM();

        // Notify components (open windows, apps) so they can re-render their labels
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('languagechanged', { detail: { lang } }));
        }

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
        if (saved && translations[saved as LangCode]) {
            currentLang = saved;
        } else {
            // Auto-detect from browser
            const browserLang = (navigator.language || 'en').split('-')[0] || 'en';
            currentLang = translations[browserLang as LangCode] ? browserLang : 'en';
        }

        if (window.state) window.state.lang = currentLang;
        Utils.Logger.log(`[i18n] Initialized with lang: ${currentLang}`);
    }
};

export { i18n };

if (typeof window !== 'undefined') {
    Services.register('i18n', i18n);
}
