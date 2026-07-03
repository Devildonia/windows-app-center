import * as THREE from 'three';
import { Services } from './ServiceContainer.js';

// ============================================
// RAGDOLL FALL REACTIONS
// Detecta impactos de caída y orquesta la reacción (audio, háptica, bocadillo)
// y la secuencia de "levantarse" tras asentarse. Extraído de Ragdoll3DCore.
// Solo lo invoca el bucle de animación del Core; no forma parte de la superficie
// pública consumida por las subclases.
// ============================================

export interface IRagdollFallReactionsDeps {
    getRigidBodies: () => Map<string, any>;
    getRagdollMode: () => boolean;
    getGrabbedBody: () => any;
    getIsFalling: () => boolean;
    setIsFalling: (value: boolean) => void;
    getStandUpTimeout: () => ReturnType<typeof setTimeout> | null;
    setStandUpTimeout: (value: ReturnType<typeof setTimeout> | null) => void;
    getModel: () => THREE.Group | undefined;
    getModelGroundY: () => number;
    getAudioManager: () => any;
    setRagdollMode: (value: boolean) => void;
    fadeToAction: (name: string) => void;
    say: (text: string, duration?: number) => void;
}

export class RagdollFallReactions {
    constructor(private readonly deps: IRagdollFallReactionsDeps) {}

    public checkFallDamage(): void {
        const headBody = this.deps.getRigidBodies().get('Head');
        if (!headBody || !this.deps.getRagdollMode() || this.deps.getGrabbedBody()) return;

        const vel = headBody.linvel();
        const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);

        if (speed > 4) {
            this.deps.setIsFalling(true);
        }

        if (speed < 0.5) {
            if (this.deps.getIsFalling()) {
                this.deps.setIsFalling(false);

                const haptics = Services.get('HapticService');
                if (Math.abs(vel.y) > 3) {
                    haptics?.heavy();
                    const audio = this.deps.getAudioManager();
                    if (audio) audio.play('boing');
                    this.deps.say('¡Ouch!', 2000);
                } else {
                    haptics?.medium();
                    const audio = this.deps.getAudioManager();
                    if (audio) audio.play('boing', { volume: 0.6 });
                }
            }

            if (!this.deps.getStandUpTimeout()) {
                this.deps.setStandUpTimeout(setTimeout(() => {
                    this.deps.setStandUpTimeout(null);
                    if (!this.deps.getGrabbedBody() && this.deps.getRagdollMode()) {
                        // Move root model to the hips physics position so it doesn't teleport back to original start position
                        const hipsBody = this.deps.getRigidBodies().get('Hips');
                        const model = this.deps.getModel();
                        if (hipsBody && model) {
                            const ht = hipsBody.translation();
                            // Solo mover X/Z — Y se preserva como _modelGroundY para
                            // que el personaje no se hunda con cada agarre/soltar.
                            model.position.set(ht.x, this.deps.getModelGroundY(), ht.z);
                        }

                        this.deps.setRagdollMode(false);
                        this.deps.fadeToAction('sleep');
                    }
                }, 1000));
            }
        } else {
            const pending = this.deps.getStandUpTimeout();
            if (pending) {
                clearTimeout(pending);
                this.deps.setStandUpTimeout(null);
            }
        }
    }
}
