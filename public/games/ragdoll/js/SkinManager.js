/**
 * RAGDOLL SYSTEM - SKIN MANAGER
 * Orchestrates layers, colors, and visual effects for the Ragdoll Workshop.
 */

export class SkinManager {
    constructor(stickman) {
        this.stickman = stickman;

        // Layers: Base, Clothes, Accessories, VFX
        this.layers = {
            base: { tint: '#000000', opacity: 1 },
            clothing_top: { image: null, scale: 1.0, offset: { x: 0, y: 0 }, tint: null },
            clothing_bottom: { image: null, scale: 1.0, offset: { x: 0, y: 0 }, tint: null },
            shoes: { image: null, scale: 1.0, offset: { x: 0, y: 0 } },
            headwear: { image: null, scale: 1.0, offset: { x: 0, y: 0 } },
            accessories: [] // Array of { part: 'hand', image: null, type: 'attachment' }
        };

        // Advanced Visuals
        this.config = {
            softJoints: false,
            showShadow: false,
            emanators: [], // Array of { type: 'fire', part: 'waist', color: '#ff4400' }
            vfxIntensity: 1.0,
            vfxSize: 1.0,
            glowMaps: new Map(), // partName -> texture/color
            animatedPatterns: new Map() // partName -> { type: 'scrolling', speed: 1.0 }
        };

        this.proportions = {
            armLength: 1.0,
            legLength: 1.0,
            torsoScale: 1.0,
            headScale: 1.0
        };
    }

    setLayerImage(layer, image) {
        if (this.layers[layer]) {
            this.layers[layer].image = image;
            this.stickman.skinEnabled = true;
        }
    }

    setProportion(prop, val) {
        if (this.proportions[prop] !== undefined) {
            this.proportions[prop] = val;
            this.stickman.rebuildSkeleton?.();
        }
    }

    toggleEmanator(type, part, color = '#ffffff') {
        const index = this.config.emanators.findIndex(e => e.type === type && e.part === part);
        if (index > -1) {
            this.config.emanators.splice(index, 1);
            return false; // Deactivated
        } else {
            this.config.emanators.push({ type, part, color });
            return true; // Activated
        }
    }

    serialize() {
        return JSON.stringify({
            layers: this.layers,
            config: this.config,
            proportions: this.proportions
        });
    }

    deserialize(data) {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        Object.assign(this.layers, parsed.layers);
        Object.assign(this.config, parsed.config);
        Object.assign(this.proportions, parsed.proportions);
    }
}
