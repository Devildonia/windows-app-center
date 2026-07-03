import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Ragdoll3DCore } from '../core/Ragdoll3DCore';
import { Kernel } from '../core/Kernel';

import { Services } from '../core/ServiceContainer';

export class Ragdoll3DViewer extends Ragdoll3DCore {
    public windowId: string = 'win-ragdoll-skins';
    private statusText: HTMLElement | null;
    private loaderText: HTMLElement | null;
    private readonly onResizeHandler: () => void;
    private initStarted: boolean = false;
    
    constructor() {
        super();
        this.container = document.getElementById('ragdoll-3d-canvas-container');
        this.statusText = document.getElementById('ragdoll-3d-status');
        this.loaderText = document.getElementById('ragdoll-3d-loader');
        this.onResizeHandler = () => this.onWindowResize();
        
        this.audioManager = Services.get('AudioManager') || null;
        
        const BubbleAnimatorCtor = Services.get('BubbleAnimator');
        if (BubbleAnimatorCtor) {
            this.bubbleAnimator = new BubbleAnimatorCtor();
        }
        
        const MessageLibraryCtor = Services.get('MessageLibrary');
        if (MessageLibraryCtor) {
            this.messageLibrary = new MessageLibraryCtor();
        }

        this.showDebug = true; // Viewer defaults to debug on.

        setTimeout(() => this.launch(), 500);
    }

    public launch(): void {
        if (this.initStarted) return;
        this.initStarted = true;
        void this.initAsync();
    }

    public async initAsync(): Promise<void> {
        this.isPlaying = true;
        this.updateStatus('Loading physical engine (@dimforge/rapier3d)...');
        
        try {
            await RAPIER.init();
            this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
            
            if (this.audioManager) {
                this.audioManager.loadSound('scream', '/games/ragdoll/assets/audio/ahh.opus');
                this.audioManager.loadSound('wii', '/games/ragdoll/assets/audio/wii.opus');
                this.audioManager.loadSound('boing', '/games/ragdoll/assets/audio/boing.opus');
            }

            this.setupThreeJS();
            await this.loadModelCore();
            
            if (this.loaderText) this.loaderText.style.display = 'none';
            this.updateStatus('Ready. Render loop active.');
            
            if (this.audioManager) this.audioManager.play('boing');

            this.animate(performance.now());
        } catch (error) {
            console.error('[Ragdoll3DViewer] Initialization failed:', error);
            this.initStarted = false;
            this.updateStatus('Error initializing Ragdoll 3D Viewer');
        }
    }

    protected override setupThreeJS(): void {
        if (!this.container) return;
        const width = this.container.clientWidth || 640;
        const height = this.container.clientHeight || 450;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x202020);

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        this.camera.position.set(0, 1.5, 4);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(3, 10, 10);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        
        window.addEventListener('resize', this.onResizeHandler);
        
        const groundColliderDesc = RAPIER.ColliderDesc.cuboid(50.0, 0.1, 50.0);
        this.world.createCollider(groundColliderDesc);

        this.setupInteractionListeners();
    }

    protected override onModelLoaded(): void {
        this.buildAnimationGui();
    }

    protected override onModelProgress(progress: number): void {
        this.updateStatus(`Loading Model: ${Math.round(progress * 100)}%`);
    }

    protected override onActionChanged(exactKey: string): void {
        const displayName = this.ANIM_MAP[exactKey] || exactKey;
        this.updateStatus(`Motion: ${displayName}`);
        
        const buttons = document.querySelectorAll('#animation-list .win95-btn');
        buttons.forEach((btn: any) => {
            if (btn.textContent.trim() === displayName) {
                btn.style.backgroundColor = '#000080';
                btn.style.color = '#fff';
            } else {
                btn.style.backgroundColor = '';
                btn.style.color = '';
            }
        });
    }

    private updateStatus(msg: string): void {
        if (this.statusText) {
            this.statusText.textContent = msg;
        }
    }

    private buildAnimationGui(): void {
        const listContainer = document.getElementById('animation-list');
        if (!listContainer) return;

        listContainer.innerHTML = ''; 

        Object.keys(this.actions).forEach(name => {
            let displayName = name;
            const entry = Object.entries(this.ANIM_MAP).find(([key]) => 
                name.toLowerCase().startsWith(key.toLowerCase()) || 
                key.toLowerCase().startsWith(name.toLowerCase())
            );
            
            if (entry) {
                displayName = entry[1];
            }

            const btn = document.createElement('button');
            btn.className = 'win95-btn';
            btn.style.textAlign = 'left';
            btn.style.fontSize = '10px';
            btn.style.padding = '4px 8px';
            btn.style.overflow = 'hidden';
            btn.style.textOverflow = 'ellipsis';
            btn.style.whiteSpace = 'nowrap';
            btn.textContent = displayName;
            btn.title = name;
            btn.onclick = () => {
                this.setRagdollMode(false);
                this.fadeToAction(name);
            };
            listContainer.appendChild(btn);
        });

        const debugBtn = document.getElementById('toggle-physics-btn');
        if (debugBtn) {
            debugBtn.onclick = () => {
                this.showDebug = !this.showDebug;
                this.debugMeshMap.forEach(mesh => mesh.visible = this.showDebug);
            };
        }

        const resetBtn = document.getElementById('reset-physics-btn');
        if (resetBtn) {
            resetBtn.onclick = () => this.resetSimulation();
        }
    }

    private resetSimulation(): void {
        this.setRagdollMode(false);
        if (this.actions['Confident_Strut']) {
            this.fadeToAction('Confident_Strut');
        }
    }

    private onWindowResize(): void {
        if (!this.container || !this.camera || !this.renderer) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        if (width === 0 || height === 0) return;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    public override terminate(): void {
        window.removeEventListener('resize', this.onResizeHandler);
        this.initStarted = false;
        super.terminate();
    }
}
