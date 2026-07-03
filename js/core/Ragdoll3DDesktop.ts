import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Ragdoll3DAI, Ragdoll3DAIState, IRagdoll3DController } from './Ragdoll3DAI';
import { Ragdoll3DCore } from './Ragdoll3DCore';

import { Services } from './ServiceContainer';

export class Ragdoll3DDesktop extends Ragdoll3DCore implements IRagdoll3DController {
    private ai!: Ragdoll3DAI;
    
    constructor() {
        super();
        this.container = document.getElementById('ragdoll3d-desktop-canvas-container');
        this.bubbleId = 'ragdoll3d-desktop-bubble';
        
        this.audioManager = Services.get('AudioManager') || null;
        if (this.audioManager) {
            this.audioManager.loadSound('scream', '/games/ragdoll/assets/audio/ahh.opus');
            this.audioManager.loadSound('wii', '/games/ragdoll/assets/audio/wii.opus');
            this.audioManager.loadSound('boing', '/games/ragdoll/assets/audio/boing.opus');
        }
        
        const BubbleAnimatorCtor = Services.get('BubbleAnimator');
        if (BubbleAnimatorCtor) {
            this.bubbleAnimator = new BubbleAnimatorCtor();
        }
        
        const MessageLibraryCtor = Services.get('MessageLibrary');
        if (MessageLibraryCtor) {
            this.messageLibrary = new MessageLibraryCtor();
        }
    }

    public async initAsync(): Promise<void> {
        this.isPlaying = true;
        if (this.container) this.container.style.display = 'block';
        
        try {
            await RAPIER.init();
            
            // Need a specific gravity for Desktop?
            this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
            
            this.setupThreeJS();
            await this.loadModelCore();
            
            if (this.audioManager) this.audioManager.play('boing');

            this.animate(performance.now());
        } catch (error) {
            console.error('[Ragdoll3DDesktop] Initialization failed:', error);
        }
    }

    protected override setupThreeJS(): void {
        if (!this.container) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.scene = new THREE.Scene();
        // Transparent BG for desktop
        // this.scene.background is implicitly null

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        this.adjustCameraToTaskbar(width, height);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(3, 10, 10);
        dirLight.castShadow = true;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 50;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        this.scene.add(dirLight);

        // Shadow catcher
        const floorGeo = new THREE.PlaneGeometry(100, 100);
        const floorMat = new THREE.ShadowMaterial({ opacity: 0.3 });
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.receiveShadow = true;
        this.scene.add(floorMesh);

        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // El cuboid por defecto se centra en (0,0,0) con semiejes (50, 0.1, 50).
        // Su superficie superior queda en Y=+0.1, pero el plano visual Three.js
        // está en Y=0. Bajamos el colisionador para que la superficie esté en Y=0
        // usando setTranslation(0, -0.1, 0) → centro en -0.1, top en 0.
        const groundColliderDesc = RAPIER.ColliderDesc.cuboid(50.0, 0.1, 50.0)
            .setTranslation(0, -0.1, 0);
        this.world.createCollider(groundColliderDesc);

        this.setupInteractionListeners();
    }

    protected override onModelLoaded(): void {
        this.ai = new Ragdoll3DAI(this);
    }

    protected override onBeforePhysicsStep(): void {
        // Run AI before physics step
        if (this.ai && this.isPhysicsSettled()) {
            this.ai.tick(0.016 * 1000); // approx 16ms
        }
    }

    protected override onRagdollGrabbed(): void {
        if (this.ai) {
            this.ai.forceState(Ragdoll3DAIState.PHYSICS_MODE);
            // Si el muñeco dice algo al agarrar, lo limpiamos rápido
            this.showBubble = false;
        }
    }

    protected override onActionChanged(exactKey: string): void {
        // Additional Desktop hooks if needed
    }

    private adjustCameraToTaskbar(width: number, height: number): void {
        const Z = 16;
        this.camera.position.z = Z;
        
        const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
        const halfHeight = Z * Math.tan(fovRad / 2);
        const taskbarProportion = 28 / height; 
        const targetY = halfHeight * (1 - 2 * taskbarProportion);
        
        this.camera.position.y = targetY;
        this.camera.lookAt(0, targetY, 0);
    }

    private onWindowResize(): void {
        if (!this.container || !this.camera || !this.renderer) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (width === 0 || height === 0) return;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        
        this.adjustCameraToTaskbar(width, height);
    }

    // --- IRagdoll3DController Implementation ---
    playAnimation(name: string): void {
        this.setRagdollMode(false);
        this.fadeToAction(name);
    }

    moveHorizontal(deltaX: number): boolean {
        if (!this.model || this.isRagdollMode) return false;
        
        const Z = this.camera.position.z;
        const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
        const halfHeight = Z * Math.tan(fovRad / 2);
        const halfWidth = halfHeight * this.camera.aspect;
        
        const limit = halfWidth - 0.8;
        const newX = this.model.position.x + deltaX;
        
        if (newX > limit || newX < -limit) {
            return true;
        }
        
        this.model.position.x = newX;
        return false;
    }

    setFacingDirection(dir: number): void {
        if (!this.model) return;
        const targetRotation = dir === 1 ? Math.PI / 2 : dir === -1 ? -Math.PI / 2 : 0;
        this.model.rotation.y = targetRotation;
    }

    speak(message: string, durationMs: number): void {
        this.say(message, durationMs);
    }

    playSound(soundName: string): void {
        if (this.audioManager) {
            this.audioManager.play(soundName);
        }
    }

    isPhysicsSettled(): boolean {
        return !this.isFalling && !this.grabbedBody;
    }
}
