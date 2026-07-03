import { CONFIG } from '../config.js';
import { Utils } from '../utils.js';
import { Services } from '../core/ServiceContainer.js';

// ============================================
// AUDIO MANAGER - Singleton
// Sistema centralizado de audio procedural
// v1.0.0 (TypeScript)
// ============================================

export interface ISoundConfig {
    type: 'tone' | 'sweep' | 'noise' | 'pulse' | 'vibrato' | 'bubbles';
    frequency?: number;
    startFreq?: number;
    endFreq?: number;
    midFreq?: number;
    duration: number;
    volume: number;
    waveType?: OscillatorType;
    pulses?: number;
    pulseDuration?: number;
    pulseGap?: number;
    vibratoRate?: number;
    baseFreq?: number;
    bubbleCount?: number;
    variations?: number;
    lowpass?: number;
    loop?: boolean;
}

export interface IPlayOptions {
    volume?: number;
    frequency?: number;
    variation?: number;
}

export interface IAudioManager {
    init(): void;
    registerSound(name: string, config: ISoundConfig): void;
    loadSound(name: string, url: string): Promise<void>;
    play(name: string, options?: IPlayOptions): boolean;
    setMute(muted: boolean): void;
    setVolume(volume: number): void;
    setEnabled(enabled: boolean): void;
    cleanup(): void;
}

class AudioManager implements IAudioManager {
    private static instance: AudioManager | null = null;

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    private context: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private isEnabled: boolean = true;
    private isMuted: boolean = false;
    private sounds: Map<string, ISoundConfig> = new Map();
    private audioBuffers: Map<string, AudioBuffer> = new Map();
    private htmlAudio: Map<string, HTMLAudioElement> = new Map();
    private initialized: boolean = false;

    public constructor() {
        if (AudioManager.instance) {
            return AudioManager.instance;
        }
        this.isEnabled = CONFIG.AUDIO?.ENABLED ?? true;
        Utils.Logger.audio('AudioManager instance created');
    }

    public init(): void {
        if (this.initialized) return;

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error('Web Audio API not supported');
            }

            this.context = new AudioContextClass();
            if (this.context) {
                this.masterGain = this.context.createGain();
                this.masterGain.connect(this.context.destination);
                this.masterGain.gain.value = CONFIG.AUDIO?.MASTER_VOLUME || 0.3;

                this.registerSounds();
                this.initialized = true;

                Utils.Logger.audio('AudioManager initialized successfully');
            }
        } catch (error) {
            Utils.Logger.error('Failed to initialize AudioManager:', error);
            this.isEnabled = false;
        }
    }

    private registerSounds(): void {
        // UI SOUNDS
        this.registerSound('blip', {
            type: 'tone',
            frequency: 800,
            duration: 0.1,
            volume: 0.6,
            waveType: 'sine'
        });

        // EMOTIONAL SOUNDS
        this.registerSound('happy', {
            type: 'sweep',
            startFreq: 500,
            endFreq: 800,
            duration: 0.2,
            volume: 0.15,
            waveType: 'sine'
        });

        this.registerSound('laugh', {
            type: 'pulse',
            frequency: 400,
            pulses: 3,
            pulseDuration: 0.1,
            pulseGap: 0.05,
            duration: 0.45, // (0.1 + 0.05) * 3
            volume: 0.12,
            waveType: 'square'
        });

        this.registerSound('sad', {
            type: 'sweep',
            startFreq: 600,
            endFreq: 200,
            duration: 0.8,
            volume: 0.1,
            waveType: 'triangle'
        });

        this.registerSound('cry', {
            type: 'vibrato',
            frequency: 200,
            vibratoRate: 6,
            duration: 0.5,
            volume: 0.12,
            waveType: 'sine'
        });

        this.registerSound('angry', {
            type: 'tone',
            frequency: 100,
            duration: 0.3,
            volume: 0.15,
            waveType: 'sawtooth'
        });

        this.registerSound('surprised', {
            type: 'sweep',
            startFreq: 300,
            endFreq: 600,
            duration: 0.1,
            volume: 0.15,
            waveType: 'sine'
        });

        this.registerSound('scared', {
            type: 'tone',
            frequency: 1000,
            duration: 0.2,
            volume: 0.12,
            waveType: 'square'
        });

        // ACTION SOUNDS
        this.registerSound('footstep', {
            type: 'noise',
            frequency: 85,
            duration: 0.05,
            volume: 0.08,
            variations: 3
        });

        this.registerSound('jump', {
            type: 'sweep',
            startFreq: 300,
            endFreq: 600,
            midFreq: 150,
            duration: 0.25,
            volume: 0.15,
            waveType: 'triangle'
        });

        this.registerSound('land', {
            type: 'noise',
            frequency: 60,
            duration: 0.1,
            volume: 0.15
        });

        this.registerSound('fall_impact', {
            type: 'noise',
            frequency: 100,
            duration: 0.2,
            volume: 0.2,
            lowpass: 200
        });

        this.registerSound('grab', {
            type: 'tone',
            frequency: 200,
            duration: 0.05,
            volume: 0.1,
            waveType: 'square'
        });

        this.registerSound('release', {
            type: 'sweep',
            startFreq: 800,
            endFreq: 200,
            duration: 0.2,
            volume: 0.12,
            waveType: 'triangle'
        });

        // INTERACTION SOUNDS
        this.registerSound('eat', {
            type: 'pulse',
            frequency: 150,
            pulses: 2,
            pulseDuration: 0.08,
            pulseGap: 0.07,
            duration: 0.3, // (0.08 + 0.07) * 2
            volume: 0.1,
            waveType: 'square'
        });

        this.registerSound('drink', {
            type: 'bubbles',
            baseFreq: 300,
            bubbleCount: 3,
            duration: 0.3,
            volume: 0.1
        });

        this.registerSound('yawn', {
            type: 'sweep',
            startFreq: 200,
            endFreq: 150,
            duration: 1.0,
            volume: 0.1,
            waveType: 'sine'
        });

        this.registerSound('snore', {
            type: 'vibrato',
            frequency: 60,
            vibratoRate: 2,
            duration: 0.8,
            volume: 0.08,
            waveType: 'triangle',
            loop: true
        });

        this.registerSound('thinking', {
            type: 'vibrato',
            frequency: 250,
            vibratoRate: 4,
            duration: 0.5,
            volume: 0.08,
            waveType: 'sine'
        });

        this.registerSound('wave', {
            type: 'sweep',
            startFreq: 400,
            endFreq: 800,
            midFreq: 400,
            duration: 0.3,
            volume: 0.15,
            waveType: 'sine'
        });

        this.registerSound('clap', {
            type: 'noise',
            frequency: 2000,
            duration: 0.08,
            volume: 0.12,
            lowpass: 3000
        });

        this.registerSound('stretch', {
            type: 'sweep',
            startFreq: 150,
            endFreq: 300,
            duration: 0.6,
            volume: 0.08,
            waveType: 'sine'
        });

        this.registerSound('dance', {
            type: 'pulse',
            frequency: 440,
            pulses: 4,
            pulseDuration: 0.1,
            pulseGap: 0.1,
            duration: 0.8, // (0.1 + 0.1) * 4
            volume: 0.1,
            waveType: 'square'
        });

        this.registerSound('step', {
            type: 'noise',
            frequency: 100,
            duration: 0.03,
            volume: 0.05,
            lowpass: 300
        });

        this.registerSound('sit', {
            type: 'noise',
            frequency: 150,
            duration: 0.3,
            volume: 0.1,
            lowpass: 500
        });

        this.registerSound('strain', {
            type: 'sweep',
            startFreq: 200,
            endFreq: 250,
            duration: 0.4,
            volume: 0.08,
            waveType: 'triangle'
        });

        this.registerSound('confused', {
            type: 'sweep',
            startFreq: 400,
            endFreq: 300,
            duration: 0.3,
            volume: 0.1,
            waveType: 'sawtooth'
        });

        this.registerSound('whoosh', {
            type: 'noise',
            frequency: 500,
            duration: 0.4,
            volume: 0.15,
            lowpass: 1000
        });

        this.registerSound('flip', {
            type: 'sweep',
            startFreq: 600,
            endFreq: 200,
            midFreq: 1000,
            duration: 0.5,
            volume: 0.15,
            waveType: 'sine'
        });

        this.registerSound('dizzy', {
            type: 'vibrato',
            frequency: 350,
            vibratoRate: 8,
            duration: 0.8,
            volume: 0.12,
            waveType: 'sine'
        });

        this.registerSound('slide', {
            type: 'sweep',
            startFreq: 200,
            endFreq: 150,
            duration: 0.3,
            volume: 0.08,
            waveType: 'triangle'
        });

        // SPECIAL SOUNDS
        this.registerSound('spawn', {
            type: 'sweep',
            startFreq: 800,
            endFreq: 200,
            duration: 0.15,
            volume: 0.15,
            waveType: 'square'
        });

        // RAGDOLL SOUNDS (Procedural)
        this.registerSound('eek', {
            type: 'sweep',
            startFreq: 800,
            endFreq: 1200,
            duration: 0.15,
            volume: 0.2,
            waveType: 'square'
        });

        this.registerSound('bonk', {
            type: 'noise',
            frequency: 150,
            duration: 0.15,
            volume: 0.25,
            lowpass: 300
        });

        this.registerSound('ooh', {
            type: 'sweep',
            startFreq: 400,
            endFreq: 500,
            duration: 0.2,
            volume: 0.15,
            waveType: 'sine'
        });

        this.registerSound('squeak', {
            type: 'pulse',
            frequency: 1000,
            pulses: 2,
            pulseDuration: 0.05,
            pulseGap: 0.03,
            duration: 0.16, // (0.05 + 0.03) * 2
            volume: 0.15,
            waveType: 'square'
        });

        this.registerSound('yelp', {
            type: 'sweep',
            startFreq: 600,
            endFreq: 900,
            duration: 0.12,
            volume: 0.18,
            waveType: 'triangle'
        });

        this.registerSound('gasp', {
            type: 'noise',
            frequency: 400,
            duration: 0.2,
            volume: 0.12,
            lowpass: 600
        });

        Utils.Logger.audio(`Registered ${this.sounds.size} procedural sounds`);
    }

    public registerSound(name: string, config: ISoundConfig): void {
        this.sounds.set(name, config);
    }

    public async loadSound(name: string, url: string): Promise<void> {
        if (!this.context) {
            try { this.init(); } catch (e) { }
        }

        const isLocal = typeof window !== 'undefined' && window.location.protocol === 'file:';

        if (!isLocal && this.context) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
                this.audioBuffers.set(name, audioBuffer);
                Utils.Logger.audio(`Loaded sound file (WebAudio): ${name}`);
                return;
            } catch (error) {
                Utils.Logger.warn(`Failed to load sound ${name} via WebAudio, trying HTML5 Audio fallback...`, error);
            }
        } else {
            Utils.Logger.audio(`Local protocol detected or context missing. Using HTML5 Audio for: ${name}`);
        }

        const audio = new Audio(url);
        audio.addEventListener('canplaythrough', () => {
            if (!this.htmlAudio.has(name)) {
                Utils.Logger.audio(`Loaded sound file (HTML5): ${name}`);
            }
            this.htmlAudio.set(name, audio);
        });
        audio.addEventListener('error', (e) => {
            Utils.Logger.error(`Failed to load sound ${name} via HTML5 Audio`, e);
        });

        this.htmlAudio.set(name, audio);
    }

    public play(name: string, options: IPlayOptions = {}): boolean {
        if (!this.isEnabled || this.isMuted) return false;

        if (!this.initialized) {
            this.init();
        }

        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }

        if (this.audioBuffers.has(name)) {
            return this.playBuffer(name, options);
        }

        if (this.htmlAudio.has(name)) {
            return this.playHTML5(name, options);
        }

        const config = this.sounds.get(name);
        if (!config) {
            Utils.Logger.warn(`Sound "${name}" not found`);
            return false;
        }

        try {
            switch (config.type) {
                case 'sweep':
                    this.playSweepSound(config, options);
                    break;
                case 'tone':
                    this.playToneSound(config, options);
                    break;
                case 'noise':
                    this.playNoiseSound(config, options);
                    break;
                case 'pulse':
                    this.playPulseSound(config, options);
                    break;
                case 'vibrato':
                    this.playVibratoSound(config, options);
                    break;
                case 'bubbles':
                    this.playBubblesSound(config, options);
                    break;
                default:
                    Utils.Logger.warn(`Unknown sound type: ${config.type}`);
                    return false;
            }
            return true;
        } catch (error) {
            Utils.Logger.error(`Error playing sound "${name}":`, error);
            return false;
        }
    }

    private playBuffer(name: string, options: IPlayOptions): boolean {
        if (!this.context || !this.masterGain) return false;
        const buffer = this.audioBuffers.get(name);
        if (!buffer) return false;

        const source = this.context.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.context.createGain();
        gainNode.gain.value = options.volume ?? 0.5;

        source.connect(gainNode);
        gainNode.connect(this.masterGain);

        source.start(0);
        return true;
    }

    private playHTML5(name: string, options: IPlayOptions): boolean {
        const audio = this.htmlAudio.get(name);
        if (!audio) return false;

        const sound = audio.cloneNode() as HTMLAudioElement;
        sound.volume = (options.volume ?? 0.5) * (CONFIG.AUDIO?.MASTER_VOLUME ?? 1);

        if (this.isMuted) sound.volume = 0;

        sound.play().catch(e => Utils.Logger.error("HTML5 Play failed", e));
        return true;
    }

    private playSweepSound(config: ISoundConfig, options: IPlayOptions): void {
        if (!this.context || !this.masterGain) return;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = config.waveType || 'sine';
        osc.frequency.setValueAtTime(config.startFreq || 440, this.context.currentTime);

        if (config.midFreq) {
            osc.frequency.exponentialRampToValueAtTime(
                config.midFreq,
                this.context.currentTime + config.duration / 2
            );
            osc.frequency.exponentialRampToValueAtTime(
                config.endFreq || 880,
                this.context.currentTime + config.duration
            );
        } else {
            osc.frequency.exponentialRampToValueAtTime(
                config.endFreq || 880,
                this.context.currentTime + config.duration
            );
        }

        const volume = options.volume || config.volume;
        gain.gain.setValueAtTime(volume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + config.duration);

        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + config.duration);
    }

    private playToneSound(config: ISoundConfig, options: IPlayOptions): void {
        if (!this.context || !this.masterGain) return;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = config.waveType || 'sine';

        let freq = options.frequency || config.frequency || 440;
        if (config.variations && options.variation !== undefined) {
            const variation = options.variation / config.variations;
            freq *= (0.9 + variation * 0.2);
        }
        osc.frequency.value = freq;

        const volume = options.volume || config.volume;
        gain.gain.setValueAtTime(volume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + config.duration);

        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + config.duration);
    }

    private playNoiseSound(config: ISoundConfig, options: IPlayOptions): void {
        if (!this.context || !this.masterGain) return;
        const bufferSize = this.context.sampleRate * config.duration;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = this.context.createBufferSource();
        noise.buffer = buffer;

        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = config.frequency || 100;

        const gain = this.context.createGain();

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        const volume = options.volume || config.volume;
        gain.gain.setValueAtTime(volume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + config.duration);

        noise.start(this.context.currentTime);
        noise.stop(this.context.currentTime + config.duration);
    }

    private playPulseSound(config: ISoundConfig, options: IPlayOptions): void {
        if (!this.context || !this.masterGain) return;
        const pulses = config.pulses || 1;
        const pulseDuration = config.pulseDuration || 0.1;
        const pulseGap = config.pulseGap || 0.1;

        for (let i = 0; i < pulses; i++) {
            const startTime = this.context.currentTime + i * (pulseDuration + pulseGap);

            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.type = config.waveType || 'square';
            osc.frequency.value = config.frequency || 440;

            const volume = options.volume || config.volume;
            gain.gain.setValueAtTime(volume, startTime);
            gain.gain.setValueAtTime(0, startTime + pulseDuration);

            osc.start(startTime);
            osc.stop(startTime + pulseDuration);
        }
    }

    private playVibratoSound(config: ISoundConfig, options: IPlayOptions): void {
        if (!this.context || !this.masterGain) return;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        const vibrato = this.context.createOscillator();
        const vibratoGain = this.context.createGain();

        const freq = config.frequency || 440;
        vibrato.frequency.value = config.vibratoRate || 5;
        vibratoGain.gain.value = freq * 0.1;

        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = config.waveType || 'sine';
        osc.frequency.value = freq;

        const volume = options.volume || config.volume;
        gain.gain.setValueAtTime(volume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + config.duration);

        vibrato.start(this.context.currentTime);
        osc.start(this.context.currentTime);
        vibrato.stop(this.context.currentTime + config.duration);
        osc.stop(this.context.currentTime + config.duration);
    }

    private playBubblesSound(config: ISoundConfig, options: IPlayOptions): void {
        if (!this.context || !this.masterGain) return;
        const bubbleCount = config.bubbleCount || 5;
        for (let i = 0; i < bubbleCount; i++) {
            const delay = (config.duration / bubbleCount) * i;
            const startTime = this.context.currentTime + delay;

            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.type = 'sine';
            const freq = (config.baseFreq || 300) + Math.random() * 100;
            osc.frequency.value = freq;

            const volume = (options.volume || config.volume) * 0.5;
            gain.gain.setValueAtTime(volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

            osc.start(startTime);
            osc.stop(startTime + 0.1);
        }
    }

    public setMute(muted: boolean): void {
        this.isMuted = muted;
        if (this.masterGain) {
            this.masterGain.gain.value = muted ? 0 : (CONFIG.AUDIO?.MASTER_VOLUME || 0.3);
        }
        Utils.Logger.audio(`Audio ${muted ? 'muted' : 'unmuted'}`);
    }

    public setVolume(volume: number): void {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = clampedVolume;
        }
        Utils.Logger.audio(`Volume set to ${clampedVolume}`);
    }

    public setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        Utils.Logger.audio(`Audio ${enabled ? 'enabled' : 'disabled'}`);
    }

    public cleanup(): void {
        if (this.context && this.context.state !== 'closed') {
            this.context.close();
        }
        this.initialized = false;
        Utils.Logger.audio('AudioManager cleaned up');
    }

    public static __resetForTesting(): void {
        AudioManager.instance = null;
    }

    public __injectContext(mockCtx: any): void {
        this.context = mockCtx;
        this.masterGain = mockCtx.createGain();
        if (this.masterGain) {
            this.masterGain.connect(mockCtx.destination);
            this.masterGain.gain.value = CONFIG.AUDIO?.MASTER_VOLUME || 0.3;
        }
        if (this.sounds.size === 0) this.registerSounds();
        this.initialized = true;
        this.isEnabled = true;
    }
}

const audioManager = AudioManager.getInstance();

export { AudioManager };

if (typeof window !== 'undefined') {
    Services.register('AudioManager', audioManager);
}

