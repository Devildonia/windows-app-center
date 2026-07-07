/**
 * RAGDOLL SYSTEM - UNIFIED UI CONTROLLER
 * Merges legacy skins and advanced workshop features into a single tabbed Win95 interface.
 */

export class RagdollUI {
    static init(ragdollPet) {
        this.ragdollPet = ragdollPet;
        // stickman/manager are null until the 2D pet is actually spawned. Keep them
        // nullable so the Workshop UI can wire its tabs and sliders on open — every
        // listener below already guards on RagdollUI.manager / RagdollUI.stickman,
        // and RagdollPet.init() re-runs this with a live stickman once spawned.
        this.stickman = ragdollPet.stickman || null;
        this.manager = this.stickman ? this.stickman.skinManager : null;
        this.selectedPart = null;

        this.setupTabs();
        this.setupGlobalSliders();
        this.setupPartAdjustments();
        this.setupDropZones();
        this.setupResetButtons();
        this.setupPhysicsControls();
        this.setupVFXControls();
        this.setupKeyboardControls();
        this.generateColorGrid();

        // Ensure the Workshop is properly initialized on first show
        this.syncUIState();
        this.showTab('skins');
    }

    static syncUIState() {
        if (!this.manager) return;

        // Sync Physics
        const props = this.manager.proportions;
        this.updateSlider('arm', props.armLength);
        this.updateSlider('leg', props.legLength);
        this.updateSlider('head', props.headScale);
        this.updateSlider('torso', props.torsoScale);

        // Sync VFX
        const config = this.manager.config;
        const softCheck = document.getElementById('check-soft');
        if (softCheck) softCheck.checked = config.softJoints;

        const shadowCheck = document.getElementById('check-shadow');
        if (shadowCheck) shadowCheck.checked = config.showShadow;

        // Sync Sliders
        this.updateLabelSlider('vfx-intensity', config.vfxIntensity || 1.0);
        this.updateLabelSlider('vfx-size', config.vfxSize || 1.0);

        // Sync Global
        const gsSlider = document.getElementById('global-scale-slider');
        if (gsSlider) gsSlider.value = this.stickman.globalScale;
        const gsVal = document.getElementById('global-scale-val');
        if (gsVal) gsVal.textContent = this.stickman.globalScale.toFixed(1);

        const gwSlider = document.getElementById('global-width-slider');
        if (gwSlider) gwSlider.value = this.stickman.globalWidthScale || 1.0;
        const gwVal = document.getElementById('global-width-val');
        if (gwVal) gwVal.textContent = (this.stickman.globalWidthScale || 1.0).toFixed(1);

        this.updateVFXButtonStates();
    }



    static updateLabelSlider(id, val) {
        const slider = document.getElementById(`slider-${id}`);
        const valSpan = document.getElementById(`val-${id}`);
        if (slider) slider.value = val;
        if (valSpan) valSpan.textContent = val.toFixed(1);
    }

    static updateSlider(id, val) {
        const slider = document.getElementById(`slider-${id}`);
        const valSpan = document.getElementById(`val-${id}`);
        if (slider) slider.value = val;
        if (valSpan) valSpan.textContent = val.toFixed(1);
    }

    static setupTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.showTab(tab.getAttribute('data-tab'));
                if (window.playBlip) window.playBlip(1100);
            });
        });
    }

    static showTab(target) {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(t => {
            const isActive = t.getAttribute('data-tab') === target;
            t.classList.toggle('active', isActive);
            t.style.background = isActive ? '#d0d0d0' : '#c0c0c0';
        });

        document.querySelectorAll('.tab-content').forEach(pane => {
            pane.style.display = pane.id === `tab-${target}` ? 'block' : 'none';
        });
    }

    static setupGlobalSliders() {
        const globalScaleSlider = document.getElementById('global-scale-slider');
        const globalScaleVal = document.getElementById('global-scale-val');
        const globalWidthSlider = document.getElementById('global-width-slider');
        const globalWidthVal = document.getElementById('global-width-val');

        if (globalScaleSlider) {
            globalScaleSlider.addEventListener('input', (e) => {
                const val = e.target.value;
                if (globalScaleVal) globalScaleVal.textContent = val;
                if (RagdollUI.stickman) RagdollUI.stickman.setGlobalScale(val);
                if (window.playBlip) window.playBlip(1000);
            });
        }

        if (globalWidthSlider) {
            globalWidthSlider.addEventListener('input', (e) => {
                const val = e.target.value;
                if (globalWidthVal) globalWidthVal.textContent = val;
                if (RagdollUI.stickman) RagdollUI.stickman.setGlobalWidthScale(val);
                if (window.playBlip) window.playBlip(1000);
            });
        }
    }

    static setupPartAdjustments() {
        const scaleSlider = document.getElementById('skin-scale-slider');
        const heightSlider = document.getElementById('skin-height-slider');
        const scaleVal = document.getElementById('skin-scale-val');
        const heightVal = document.getElementById('skin-height-val');

        if (scaleSlider) {
            scaleSlider.addEventListener('input', (e) => {
                if (!RagdollUI.selectedPart) return;
                const val = e.target.value;
                if (scaleVal) scaleVal.textContent = val;
                if (RagdollUI.stickman) RagdollUI.stickman.updateSkinConfig(RagdollUI.selectedPart, 'scale', val);
                if (window.playBlip) window.playBlip(1100);
            });
        }

        if (heightSlider) {
            heightSlider.addEventListener('input', (e) => {
                if (!RagdollUI.selectedPart) return;
                const val = e.target.value;
                if (heightVal) heightVal.textContent = val;
                if (RagdollUI.stickman) RagdollUI.stickman.updateSkinConfig(RagdollUI.selectedPart, 'y', val);
                if (window.playBlip) window.playBlip(1100);
            });
        }
    }

    static setupDropZones() {
        const zones = document.querySelectorAll('.drop-zone');
        const label = document.getElementById('selected-part-label');
        const scaleSlider = document.getElementById('skin-scale-slider');
        const heightSlider = document.getElementById('skin-height-slider');

        zones.forEach(zone => {
            const part = zone.getAttribute('data-part');

            zone.addEventListener('click', () => {
                RagdollUI.selectedPart = part;
                if (label) label.textContent = part.charAt(0).toUpperCase() + part.slice(1);

                // Highlight selected
                zones.forEach(z => z.style.outline = 'none');
                zone.style.outline = '2px solid #000080';

                // Enable and update sliders
                if (RagdollUI.stickman) {
                    const config = RagdollUI.stickman.skinConfig[part] || { scale: 1.0, y: 0 };
                    if (scaleSlider) {
                        scaleSlider.disabled = false;
                        scaleSlider.value = config.scale;
                        if (document.getElementById('skin-scale-val')) {
                            document.getElementById('skin-scale-val').textContent = scaleSlider.value;
                        }
                    }
                    if (heightSlider) {
                        heightSlider.disabled = false;
                        heightSlider.value = config.y;
                        if (document.getElementById('skin-height-val')) {
                            document.getElementById('skin-height-val').textContent = heightSlider.value;
                        }
                    }
                }
                if (window.playBlip) window.playBlip(1300);
            });

            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.style.background = '#e0e0ff';
            });

            zone.addEventListener('dragleave', () => {
                zone.style.background = '#fff';
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.style.background = '#fff';
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const src = event.target.result;
                        if (RagdollUI.stickman) {
                            RagdollUI.stickman.updatePartImage(part, src);
                        }

                        // Update preview
                        zone.innerHTML = '';
                        const img = document.createElement('img');
                        img.src = src;
                        img.style.maxWidth = '100%';
                        img.style.maxHeight = '40px';
                        img.style.objectFit = 'contain';
                        zone.appendChild(img);

                        const cap = document.createElement('span');
                        cap.textContent = part;
                        cap.style.fontSize = '8px';
                        zone.appendChild(cap);

                        if (window.playBlip) window.playBlip(900);
                    };
                    reader.readAsDataURL(file);
                }
            });
        });
    }

    static setupResetButtons() {
        const resetBtn = document.getElementById('reset-global-scale');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (RagdollUI.stickman) {
                    RagdollUI.stickman.resetCustomSkin();
                }
                RagdollUI.syncUIState();

                document.querySelectorAll('.drop-zone').forEach(zone => {
                    const part = zone.getAttribute('data-part');
                    zone.innerHTML = `<span style="font-size: 16px;">${RagdollUI.getPartEmoji(part)}</span><span style="font-size: 9px;">${part}</span>`;
                    zone.style.background = '#fff';
                    zone.style.outline = 'none';
                });

                if (window.playBlip) window.playBlip(600);
            });
        }
    }

    static setupPhysicsControls() {
        const handle = (id, prop) => {
            const slider = document.getElementById(`slider-${id}`);
            const valSpan = document.getElementById(`val-${id}`);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    if (valSpan) valSpan.textContent = val.toFixed(1);
                    if (RagdollUI.manager) {
                        RagdollUI.manager.setProportion(prop, val);
                    }
                    if (window.playBlip) window.playBlip(1050);
                });
            }
        };

        handle('arm', 'armLength');
        handle('leg', 'legLength');
        handle('head', 'headScale');
        handle('torso', 'torsoScale');
    }

    static setupVFXControls() {
        const softCheck = document.getElementById('check-soft');
        if (softCheck) {
            softCheck.addEventListener('change', (e) => {
                if (RagdollUI.manager) {
                    RagdollUI.manager.config.softJoints = e.target.checked;
                }
                if (window.playBlip) window.playBlip(800);
            });
        }

        const shadowCheck = document.getElementById('check-shadow');
        if (shadowCheck) {
            shadowCheck.addEventListener('change', (e) => {
                if (RagdollUI.manager) {
                    RagdollUI.manager.config.showShadow = e.target.checked;
                }
                if (window.playBlip) window.playBlip(800);
            });
        }

        // VFX Sliders
        const handleSlider = (id, prop) => {
            const slider = document.getElementById(`slider-${id}`);
            const valSpan = document.getElementById(`val-${id}`);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    if (valSpan) valSpan.textContent = val.toFixed(1);
                    if (RagdollUI.manager) {
                        RagdollUI.manager.config[prop] = val;
                    }
                });
            }
        };

        handleSlider('vfx-intensity', 'vfxIntensity');
        handleSlider('vfx-size', 'vfxSize');

        document.querySelectorAll('.vfx-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (RagdollUI.manager) {
                    const type = btn.getAttribute('data-type');
                    const active = RagdollUI.manager.toggleEmanator(type, 'waist');

                    RagdollUI.updateVFXButtonStates();
                    if (window.playBlip) window.playBlip(active ? 1500 : 700);
                }
            });
        });
    }

    static updateVFXButtonStates() {
        if (!RagdollUI.manager) return;
        const activeTypes = RagdollUI.manager.config.emanators.map(e => e.type);
        document.querySelectorAll('.vfx-btn').forEach(btn => {
            const type = btn.getAttribute('data-type');
            const isActive = activeTypes.includes(type);
            btn.style.background = isActive ? '#a0a0ff' : '#c0c0c0';
            btn.style.border = isActive ? '2px inset #fff' : '2px outset #fff';
        });
    }

    static generateColorGrid() {
        const grid = document.getElementById('color-grid-skins');
        if (!grid) return;

        const colors = [
            '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
            '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'
        ];

        grid.innerHTML = colors.map(c => `<div class="color-cell" data-color="${c}" style="width: 100%; height: 16px; background: ${c}; border: 1px solid #808080; cursor: pointer;"></div>`).join('');

        grid.querySelectorAll('.color-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const color = cell.getAttribute('data-color');
                if (RagdollUI.manager) {
                    RagdollUI.manager.layers.base.tint = color;
                    if (window.playBlip) window.playBlip(1200);
                }
            });
        });
    }

    static getPartEmoji(part) {
        const map = {
            head: '🙂',
            shirt: '👕',
            neck: '🧣',
            leftArm: '💪L',
            rightArm: '💪R',
            leftLeg: '🦵L',
            rightLeg: '🦵R'
        };
        return map[part] || '📦';
    }

    static setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            if (!this.stickman || !this.ragdollPet.isActive) return;

            // Ignore if typing in an input/textarea
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            const key = e.key.toLowerCase();

            // Movement (Horizontal)
            if (key === 'a' || key === 'arrowleft') {
                this.stickman.state = 'walking';
                this.stickman.direction = -1;
                this.stickman.walkSpeed = 2.0;
            } else if (key === 'd' || key === 'arrowright') {
                this.stickman.state = 'walking';
                this.stickman.direction = 1;
                this.stickman.walkSpeed = 2.0;
            }

            // Jump
            if (key === 'w' || key === 'arrowup' || key === ' ') {
                if (this.stickman.state !== 'jumping') {
                    this.stickman.startJumping();
                }
                e.preventDefault(); // Stop scrolling with space/arrows
            }

            // Physics Toggle
            if (key === 'p') {
                if (this.stickman.physicsMode) {
                    this.stickman.deactivatePhysics();
                } else {
                    this.stickman.activatePhysics();
                }
            }

            // Reset / Stand Up
            if (key === 'r') {
                this.stickman.deactivatePhysics();
                this.stickman.standUp();
                this.stickman.state = 'idle';
                this.stickman.emotion = 'happy';
            }
        });

        window.addEventListener('keyup', (e) => {
            if (!this.stickman) return;
            const key = e.key.toLowerCase();
            if (['a', 'd', 'arrowleft', 'arrowright'].includes(key)) {
                if (this.stickman.state === 'walking') {
                    this.stickman.state = 'idle';
                    this.stickman.walkSpeed = 0;
                }
            }
        });
    }
}
