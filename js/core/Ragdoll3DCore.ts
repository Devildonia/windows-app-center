import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { Services } from './ServiceContainer';

export abstract class Ragdoll3DCore {
    protected container: HTMLElement | null = null;
    
    // Three.js
    protected scene!: THREE.Scene;
    protected camera!: THREE.PerspectiveCamera;
    protected renderer!: THREE.WebGLRenderer;
    protected mixer!: THREE.AnimationMixer;
    protected actions: Record<string, THREE.AnimationAction> = {};
    protected activeAction!: THREE.AnimationAction;
    protected lastTime: number = 0;
    protected physicsAccumulator: number = 0;
    protected readonly FIXED_TIMESTEP: number = 1 / 60;
    protected model!: THREE.Group;
    
    protected raycaster: THREE.Raycaster = new THREE.Raycaster();
    protected mouse: THREE.Vector2 = new THREE.Vector2();
    protected grabbedBody: any = null;
    protected isRagdollMode: boolean = false;
    protected lastMousePos: THREE.Vector3 = new THREE.Vector3();
    protected mouseVelocity: THREE.Vector3 = new THREE.Vector3();
    protected interactionPlane: THREE.Plane = new THREE.Plane();
    protected mouseAnchorBody: RAPIER.RigidBody | null = null;
    protected mouseJoint: RAPIER.ImpulseJoint | null = null;
    protected grabOffset: THREE.Vector3 = new THREE.Vector3();
    protected modelScale: number = 1.0; 
    protected grabDistance: number = 0;
    protected isFalling: boolean = false;
    protected _lastMouseMoveTime: number = 0;
    /** Lista cacheada de todos los SkinnedMesh del modelo — evita traverse() por frame */
    protected _skinnedMeshes: THREE.SkinnedMesh[] = [];
    /** Y inicial del model.position en bind pose — nunca debe cambiar durante el drag */
    protected _modelGroundY: number = 0;

    // External Services
    protected audioManager: any = null;
    protected bubbleAnimator: any = null;
    protected messageLibrary: any = null;
    protected showBubble: boolean = false;
    protected bubbleTimeout: any = null;
    protected standUpTimeout: ReturnType<typeof setTimeout> | null = null;
    protected bubbleId: string = 'ragdoll-3d-bubble';

    private static readonly _scratchVec3A = new THREE.Vector3();
    private static readonly _scratchVec3B = new THREE.Vector3();

    protected readonly ANIM_MAP: Record<string, string> = {
        'Confident_Strut': 'Baile_1',
        'Fall_Dead_from_Abdom': 'Stand_Pose',
        'Hip_Hop_Dance_3': 'Saludo',
        'Hop_with_Arms_Raised': 'Correr',
        'Running': 'Hablar',
        'Stand_Talking_Angry': 'Hablar_2',
        'Stand_Up1': 'Caminar',
        'Superlove_Pop_Dance': 'Tumbarse',
        'Talk_with_Hands_Open': 'Caminar_2',
        'Talk_with_Left_Hand_on': 'Caerse',
        'Walking': 'Baile_2',
        'Wave_for_Help': 'Saltar',
        'sleep': 'Levantarse'
    };
    
    // Rapier physics
    protected world: any;
    protected rigidBodies: Map<string, any> = new Map();
    protected boneRigidBodyMap: Map<string, THREE.Bone> = new Map();
    
    // Debug
    protected debugMeshMap: Map<string, THREE.Mesh> = new Map();
    protected showDebug: boolean = false;
    
    protected isPlaying: boolean = false;
    protected animationFrameId: number = 0;
    protected interactionListenersAttached: boolean = false;
    private readonly boundOnMouseDown = (event: MouseEvent): void => this.onMouseDown(event);
    private readonly boundOnMouseMove = (event: MouseEvent): void => this.onMouseMove(event);
    private readonly boundOnMouseUp = (): void => this.onMouseUp();

    protected static readonly _scratchVector1 = new THREE.Vector3();
    protected static readonly _scratchVector2 = new THREE.Vector3();
    protected static readonly _scratchVector3 = new THREE.Vector3();
    protected static readonly _scratchQuat1 = new THREE.Quaternion();
    protected static readonly _scratchQuat2 = new THREE.Quaternion();
    protected static readonly _scratchQuat3 = new THREE.Quaternion();

    constructor() {}

    public abstract initAsync(): Promise<void>;
    
    public terminate(): void {
        this.isPlaying = false;
        if (this.container) this.container.style.display = 'none';

        window.removeEventListener('mousedown', this.boundOnMouseDown);
        window.removeEventListener('mousemove', this.boundOnMouseMove);
        window.removeEventListener('mouseup', this.boundOnMouseUp);
        this.interactionListenersAttached = false;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.renderer) {
            this.renderer.dispose();
            if (this.container && this.renderer.domElement.parentNode === this.container) {
                this.container.removeChild(this.renderer.domElement);
            }
        }
        
        if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);
        if (this.standUpTimeout) {
            clearTimeout(this.standUpTimeout);
            this.standUpTimeout = null;
        }

        // Dispose of model resources
        if (this.model) {
            this.model.traverse((obj: any) => {
                if (obj.isMesh || obj.isSkinnedMesh) {
                    obj.geometry?.dispose();
                    if (obj.material) {
                        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
                        materials.forEach((m: any) => {
                            m?.map?.dispose();
                            m?.dispose();
                        });
                    }
                }
            });
        }

        // Dispose of debug mesh resources
        this.debugMeshMap.forEach(mesh => {
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m: any) => m?.dispose());
            } else if (mesh.material) {
                mesh.material.dispose();
            }
        });
        this.debugMeshMap.clear();
        
        if (this.world) {
            this.world.free();
        }
        
    }

    protected abstract setupThreeJS(): void;

    protected async loadModelCore(): Promise<void> {
        const loader = new GLTFLoader();
        
        return new Promise((resolve, reject) => {
            loader.load(
                'games/ragdoll3d/assets/models/Ragdoll_3D.glb',
                (gltf) => {
                    this.model = gltf.scene;
                    this.model.scale.set(this.modelScale, this.modelScale, this.modelScale);
                    this.scene.add(this.model);

                    // Guardar el Y inicial del modelo (bind pose sobre el suelo).
                    // Se usa para restaurar la altura correcta después del drag sin acumular drift.
                    this._modelGroundY = this.model.position.y;

                    this.model.traverse((object: any) => {
                        // frustumCulled=false en TODOS los nodos del grafo, no solo SkinnedMesh.
                        // Three.js projectObject() descarta toda la subjerarquía si un nodo
                        // padre (Group, Armature, Object3D) queda fuera del frustum estático.
                        object.frustumCulled = false;

                        if (object.isMesh || object.isSkinnedMesh) {
                            object.castShadow = true;
                            object.receiveShadow = true;
                            object.userData.isRagdollPart = true;
                        }
                        if (object.isSkinnedMesh) {
                            this._skinnedMeshes.push(object as THREE.SkinnedMesh);
                            const geo = object.geometry as THREE.BufferGeometry;
                            geo.boundingBox = new THREE.Box3(
                                new THREE.Vector3(-1000, -1000, -1000),
                                new THREE.Vector3(1000, 1000, 1000)
                            );
                            geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1000);
                            geo.computeBoundingBox = () => {};
                            geo.computeBoundingSphere = () => {};
                        }
                    });
                    
                    this.mixer = new THREE.AnimationMixer(this.model);
                    this.model.traverse((node: any) => {
                        if (node.isBone) {
                            this.boneRigidBodyMap.set(node.name, node);
                            this.createRigidBodyForBone(node);
                        }
                    });

                    this.setupJoints();
                    
                    gltf.animations.forEach((clip) => {
                        const action = this.mixer.clipAction(clip);
                        this.actions[clip.name] = action;
                    });

                    if (gltf.animations.length > 0) {
                        this.activeAction = this.actions[gltf.animations[0].name];
                        this.activeAction.play();
                    }
                    
                    this.onModelLoaded();
                    resolve();
                },
                (xhr) => {
                    this.onModelProgress(xhr.loaded / xhr.total);
                },
                (error) => {
                    console.error('[Ragdoll3DCore] GLTF load error', error);
                    reject(error);
                }
            );
        });
    }

    protected abstract onModelLoaded(): void;
    protected onModelProgress(progress: number): void {}

    protected animate = (time: number): void => {
        if (!this.isPlaying) return;
        
        this.animationFrameId = requestAnimationFrame(this.animate);
        
        let delta = this.lastTime ? (time - this.lastTime) / 1000 : 0;
        this.lastTime = time;
        
        // Cap delta to avoid spiral of death
        if (delta > 0.1) delta = 0.1;
        
        if (this.mixer) this.mixer.update(delta);
        if (this.world) {
            this.physicsAccumulator += delta;
            while (this.physicsAccumulator >= this.FIXED_TIMESTEP) {
                this.onBeforePhysicsStep();
                this.world.step();
                this.physicsAccumulator -= this.FIXED_TIMESTEP;
            }
            this.syncPhysicsWithBones();
            this.checkFallDamage();
        }
        
        // Garantizar frustumCulled=false usando la lista cacheada — sin traverse() por frame.
        // Necesario antes de renderer.render() porque skeleton.update() dentro del
        // AnimationMixer puede resetear este flag al recalcular el skinning.
        for (let i = 0; i < this._skinnedMeshes.length; i++) {
            this._skinnedMeshes[i].frustumCulled = false;
        }
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
            this.updateSpeechBubble();
        }
        
        this.onAfterRender();
    }
    
    protected onBeforePhysicsStep(): void {}
    protected onAfterRender(): void {}

    protected fadeToAction(name: string): void {
        const exactKey = Object.keys(this.actions).find(k => k.toLowerCase() === name.toLowerCase()) || name;
        const nextAction = this.actions[exactKey];
        if (!nextAction || nextAction === this.activeAction) return;

        nextAction.reset();
        nextAction.setEffectiveTimeScale(1);
        nextAction.setEffectiveWeight(1);
        nextAction.fadeIn(0.5);
        nextAction.play();

        if (this.activeAction) {
            this.activeAction.fadeOut(0.5);
        }

        this.activeAction = nextAction;
        this.onActionChanged(exactKey);
    }

    protected onActionChanged(exactKey: string): void {}

    protected setRagdollMode(enabled: boolean): void {
        if (this.isRagdollMode === enabled) return;
        this.isRagdollMode = enabled;

        this.rigidBodies.forEach((body, boneName) => {
            if (enabled) {
                // Antes de activar la física dinámica, teletransportar el cuerpo
                // a la posición exacta del hueso en la animación actual.
                // Sin este snap, Rapier hereda la posición física anterior (puede
                // estar ligeramente bajo el suelo por tunneling previo) y la
                // resolución de penetración empuja en dirección incorrecta.
                const bone = this.boneRigidBodyMap.get(boneName);
                if (bone) {
                    const wp = new THREE.Vector3();
                    const wq = new THREE.Quaternion();
                    bone.getWorldPosition(wp);
                    bone.getWorldQuaternion(wq);
                    body.setTranslation({ x: wp.x, y: wp.y, z: wp.z }, false);
                    body.setRotation({ x: wq.x, y: wq.y, z: wq.z, w: wq.w }, false);
                    body.setLinvel({ x: 0, y: 0, z: 0 }, false);
                    body.setAngvel({ x: 0, y: 0, z: 0 }, false);
                }
                body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
                body.resetForces(true);
                body.resetTorques(true);
            } else {
                body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
            }
        });

        if (enabled && this.mixer) {
            this.mixer.stopAllAction();
        }
    }

    protected createRigidBodyForBone(bone: THREE.Bone): void {
        const boneName = bone.name;
        const mainBones = ['Hips', 'Spine', 'Head', 'LeftArm', 'LeftForeArm', 'RightArm', 'RightForeArm', 'LeftUpLeg', 'LeftLeg', 'RightUpLeg', 'RightLeg'];
        if (!mainBones.includes(boneName)) return;

        const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
        
        const tempPos = new THREE.Vector3();
        const tempQuat = new THREE.Quaternion();
        bone.getWorldPosition(tempPos);
        bone.getWorldQuaternion(tempQuat);
        bodyDesc.setTranslation(tempPos.x, tempPos.y, tempPos.z);
        bodyDesc.setRotation({ x: tempQuat.x, y: tempQuat.y, z: tempQuat.z, w: tempQuat.w });

        bodyDesc.setLinearDamping(1.5);
        bodyDesc.setAngularDamping(4.0);
        bodyDesc.setCanSleep(false);
        // CCD (Continuous Collision Detection): evita que los cuerpos rápidos
        // atraviesen el suelo al activarse la física dinámica desde la animación.
        // Sin CCD, colisionadores pequeños (capsule r=0.05) hacen tunneling
        // acumulando un error Y negativo en cada ciclo agarre/soltar.
        bodyDesc.setCcdEnabled(true);
        const body = this.world.createRigidBody(bodyDesc);

        let colliderDesc;
        let color = 0x00ff00;

        if (boneName === 'Hips' || boneName === 'Spine') {
            colliderDesc = RAPIER.ColliderDesc.cuboid(0.15, 0.1, 0.1);
            color = 0x0000ff;
        } else if (boneName === 'Head') {
            colliderDesc = RAPIER.ColliderDesc.ball(0.12);
            color = 0xff0000;
        } else {
            colliderDesc = RAPIER.ColliderDesc.capsule(0.1, 0.05);
            color = 0x00ff00;
        }

        const collider = this.world.createCollider(colliderDesc, body);
        collider.setCollisionGroups(0x0002FFFD); 
        
        this.rigidBodies.set(boneName, body);

        if (this.showDebug) {
            let geometry;
            if (boneName === 'Hips' || boneName === 'Spine') {
                geometry = new THREE.BoxGeometry(0.3, 0.2, 0.2);
            } else if (boneName === 'Head') {
                geometry = new THREE.SphereGeometry(0.12);
            } else {
                geometry = new THREE.CapsuleGeometry(0.05, 0.2);
            }
            const material = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.5 });
            const debugMesh = new THREE.Mesh(geometry, material);
            debugMesh.userData.isRagdollPart = true;
            debugMesh.userData.boneName = boneName;
            
            this.scene.add(debugMesh);
            this.debugMeshMap.set(boneName, debugMesh);
        }
    }

    protected setupJoints(): void {
        const hierarchy = [
            { parent: 'Hips', child: 'Spine', limits: { x: [-0.2, 0.2], y: [-0.2, 0.2], z: [-0.2, 0.2] } },
            { parent: 'Spine', child: 'Head', limits: { x: [-0.5, 0.5], y: [-0.5, 0.5], z: [-0.5, 0.5] } },
            { parent: 'Spine', child: 'LeftArm', limits: { x: [-1.5, 0.5], y: [-1.5, 1.5], z: [-1.5, 1.5] } },
            { parent: 'LeftArm', child: 'LeftForeArm', limits: { x: [0, 2.0], y: [0, 0], z: [0, 0] } },
            { parent: 'Spine', child: 'RightArm', limits: { x: [-1.5, 0.5], y: [-1.5, 1.5], z: [-1.5, 1.5] } },
            { parent: 'RightArm', child: 'RightForeArm', limits: { x: [0, 2.0], y: [0, 0], z: [0, 0] } },
            { parent: 'Hips', child: 'LeftUpLeg', limits: { x: [-1.0, 0.5], y: [-0.2, 0.2], z: [-0.5, 0.5] } },
            { parent: 'LeftUpLeg', child: 'LeftLeg', limits: { x: [-2.0, 0], y: [0, 0], z: [0, 0] } },
            { parent: 'Hips', child: 'RightUpLeg', limits: { x: [-1.0, 0.5], y: [-0.2, 0.2], z: [-0.5, 0.5] } },
            { parent: 'RightUpLeg', child: 'RightLeg', limits: { x: [-2.0, 0], y: [0, 0], z: [0, 0] } }
        ];

        hierarchy.forEach(pair => {
            const parentBody = this.rigidBodies.get(pair.parent);
            const childBody = this.rigidBodies.get(pair.child);

            if (parentBody && childBody) {
                const parentPos = parentBody.translation();
                const childPos = childBody.translation();

                const pPos = new THREE.Vector3(parentPos.x, parentPos.y, parentPos.z);
                const cPos = new THREE.Vector3(childPos.x, childPos.y, childPos.z);
                
                // Vector in WORLD space pointing from Parent center to Child center
                const offsetW = new THREE.Vector3().subVectors(cPos, pPos);
                
                // Get Parent's initial rotation and invert it to move world offset to local space
                const pRotRaw = parentBody.rotation();
                const pRot = new THREE.Quaternion(pRotRaw.x, pRotRaw.y, pRotRaw.z, pRotRaw.w);
                offsetW.applyQuaternion(pRot.invert());

                const anchorInParent = { x: offsetW.x, y: offsetW.y, z: offsetW.z };
                const anchorInChild = { x: 0, y: 0, z: 0 };
                
                const params = RAPIER.JointData.spherical(anchorInParent, anchorInChild);
                this.world.createImpulseJoint(params, parentBody, childBody, true);
            }
        });
    }

    protected syncPhysicsWithBones(): void {
        const tempPos = Ragdoll3DCore._scratchVector1;
        const tempQuat = Ragdoll3DCore._scratchQuat1;

        this.boneRigidBodyMap.forEach((bone, name) => {
            const body = this.rigidBodies.get(name);
            if (!body) return;

            if (!this.isRagdollMode) {
                // Animation drives physics bodies
                bone.getWorldPosition(tempPos);
                bone.getWorldQuaternion(tempQuat);
                body.setNextKinematicTranslation(tempPos);
                body.setNextKinematicRotation(tempQuat);
            } else {
                // Physics drives visual bones
                const translation = body.translation();
                const rotation = body.rotation();
                
                const parent = bone.parent;
                if (parent) {
                    const worldPos = Ragdoll3DCore._scratchVector2.set(translation.x, translation.y, translation.z);
                    const worldQuat = Ragdoll3DCore._scratchQuat2.set(rotation.x, rotation.y, rotation.z, rotation.w);
                    
                    const localPos = Ragdoll3DCore._scratchVector3.copy(worldPos);
                    parent.worldToLocal(localPos);
                    bone.position.copy(localPos);
                    
                    const parentWorldQuat = Ragdoll3DCore._scratchQuat3;
                    parent.getWorldQuaternion(parentWorldQuat);
                    
                    const localQuat = worldQuat;
                    parentWorldQuat.invert();
                    localQuat.premultiply(parentWorldQuat);
                    bone.quaternion.copy(localQuat);
                    
                    // Force the matrix update to prevent frustum culling from dropping the mesh
                    bone.updateMatrixWorld(true);
                } else {
                    bone.position.set(translation.x, translation.y, translation.z);
                    bone.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
                    bone.updateMatrixWorld(true);
                }
            }

            if (this.showDebug) {
                const debugMesh = this.debugMeshMap.get(name);
                if (debugMesh) {
                    const translation = body.translation();
                    const rotation = body.rotation();
                    debugMesh.position.set(translation.x, translation.y, translation.z);
                    debugMesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
                }
            }
        });
    }

    protected checkFallDamage(): void {
        const headBody = this.rigidBodies.get('Head');
        if (!headBody || !this.isRagdollMode || this.grabbedBody) return;

        const vel = headBody.linvel();
        const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
        
        if (speed > 4) { 
            this.isFalling = true;
        }
        
        if (speed < 0.5) {
            if (this.isFalling) {
                this.isFalling = false;
                
                const haptics = Services.get('HapticService');
                if (Math.abs(vel.y) > 3) {
                    haptics?.heavy();
                    if (this.audioManager) this.audioManager.play('boing');
                    this.say('¡Ouch!', 2000);
                } else {
                    haptics?.medium();
                    if (this.audioManager) this.audioManager.play('boing', { volume: 0.6 });
                }
            }

            if (!this.standUpTimeout) {
                this.standUpTimeout = setTimeout(() => {
                    this.standUpTimeout = null;
                    if (!this.grabbedBody && this.isRagdollMode) {
                        // Move root model to the hips physics position so it doesn't teleport back to original start position
                        const hipsBody = this.rigidBodies.get('Hips');
                        if (hipsBody && this.model) {
                            const ht = hipsBody.translation();
                            // Solo mover X/Z — Y se preserva como _modelGroundY para
                            // que el personaje no se hunda con cada agarre/soltar.
                            this.model.position.set(ht.x, this._modelGroundY, ht.z);
                        }
                        
                        this.setRagdollMode(false);
                        this.fadeToAction('sleep');
                    }
                }, 1000);
            }
        } else {
            if (this.standUpTimeout) {
                clearTimeout(this.standUpTimeout);
                this.standUpTimeout = null;
            }
        }
    }

    protected say(text: string, duration: number = 2000): void {
        const calcDuration = duration || Math.min(8000, Math.max(2000, text.length * 80));
        
        if (!this.bubbleAnimator) {
            return;
        }

        this.showBubble = true;
        if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);

        this.bubbleAnimator.fullBubble('b_' + Date.now(), calcDuration, { wobble: true },
            (an: any) => { },
            () => { this.showBubble = false; }
        );

        const bubbleEl = document.getElementById(this.bubbleId);
        if (bubbleEl) {
            bubbleEl.textContent = text;
            bubbleEl.style.display = 'block';
        }

        this.bubbleTimeout = setTimeout(() => {
            this.showBubble = false;
            if (bubbleEl) bubbleEl.style.display = 'none';
        }, calcDuration);
    }

    protected updateSpeechBubble(): void {
        if (!this.showBubble || !this.camera || !this.container) return;
        
        const bubbleEl = document.getElementById(this.bubbleId);
        if (!bubbleEl) return;

        const headNode = this.boneRigidBodyMap.get('Head');
        if (headNode) {
            const tempPos = Ragdoll3DCore._scratchVector1;
            headNode.getWorldPosition(tempPos);
            tempPos.y += 0.3;
            tempPos.project(this.camera);

            const rect = this.container.getBoundingClientRect();
            const x = (tempPos.x * .5 + .5) * rect.width + rect.left;
            const y = (tempPos.y * -.5 + .5) * rect.height + rect.top;

            bubbleEl.style.left = `${x}px`;
            bubbleEl.style.top = `${y}px`;
            bubbleEl.style.transform = 'translate(-50%, -100%)';
        }
    }

    protected setupInteractionListeners(): void {
        if (!this.container || this.interactionListenersAttached) return;
        window.addEventListener('mousedown', this.boundOnMouseDown);
        window.addEventListener('mousemove', this.boundOnMouseMove);
        window.addEventListener('mouseup', this.boundOnMouseUp);
        this.interactionListenersAttached = true;
    }

    protected onMouseDown(event: MouseEvent): void {
        if (!this.container || !this.renderer || !this.camera) return;

        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        let targetBoneName: string | null = null;
        let intersectPoint = new THREE.Vector3();
        let intersectDistance = 0;

        if (this.showDebug) {
            const debugMeshes = Array.from(this.debugMeshMap.values());
            const intersects = this.raycaster.intersectObjects(debugMeshes, false);
            if (intersects.length > 0) {
                targetBoneName = intersects[0].object.userData.boneName;
                intersectPoint = intersects[0].point;
                intersectDistance = intersects[0].distance;
            }
        } 
        
        if (!targetBoneName && this.model) {
            const intersects = this.raycaster.intersectObject(this.model, true);
            if (intersects.length > 0) {
                const hit = intersects[0];
                intersectPoint = hit.point;
                intersectDistance = hit.distance;
                
                let closestDist = Infinity;
                this.rigidBodies.forEach((body, name) => {
                    const translation = body.translation();
                    const bodyPos = new THREE.Vector3(translation.x, translation.y, translation.z);
                    const dist = bodyPos.distanceTo(intersectPoint);
                    if (dist < closestDist) {
                        closestDist = dist;
                        targetBoneName = name;
                    }
                });
            }
        }

        if (targetBoneName) {
            this.grabbedBody = this.rigidBodies.get(targetBoneName);
            if (this.grabbedBody) {
                this.setRagdollMode(true);
                
                // Do NOT set body to kinematic, keep it dynamic so momentum works
                const planeNormal = new THREE.Vector3();
                this.camera.getWorldDirection(planeNormal);
                planeNormal.negate(); 
                this.interactionPlane.setFromNormalAndCoplanarPoint(planeNormal, intersectPoint);
                
                const translation = this.grabbedBody.translation();
                const bodyPos = new THREE.Vector3(translation.x, translation.y, translation.z);
                this.grabOffset.subVectors(bodyPos, intersectPoint);
                
                // Create a kinematic anchor at the exact intersection point
                const anchorDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(intersectPoint.x, intersectPoint.y, intersectPoint.z);
                this.mouseAnchorBody = this.world.createRigidBody(anchorDesc);
                
                // Tie the dynamic grabbed body to this anchor using a spherical joint
                const localAnchorInBody = { x: -this.grabOffset.x, y: -this.grabOffset.y, z: -this.grabOffset.z };
                const localAnchorInMouse = { x: 0, y: 0, z: 0 };
                const jointData = RAPIER.JointData.spherical(localAnchorInBody, localAnchorInMouse);
                this.mouseJoint = this.world.createImpulseJoint(jointData, this.grabbedBody, this.mouseAnchorBody, true);
                
                this.lastMousePos.copy(intersectPoint);
                this.mouseVelocity.set(0, 0, 0);
                this._lastMouseMoveTime = 0; // reset para que el primer delta sea limpio

                 if (this.audioManager) this.audioManager.play('wii');
                 this.onRagdollGrabbed();
             }
         }
     }
 
     protected onRagdollGrabbed(): void {
         const mem = Services.get('RagdollMemory');
         if (mem) mem.recordGrab();
     }
 
     protected onMouseMove(event: MouseEvent): void {
         if (!this.grabbedBody || !this.mouseAnchorBody || !this.camera || !this.container) return;
 
         const rect = this.container.getBoundingClientRect();
         this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
         this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
 
         this.raycaster.setFromCamera(this.mouse, this.camera);
         const pos = Ragdoll3DCore._scratchVec3A;
         const hit = this.raycaster.ray.intersectPlane(this.interactionPlane, pos);
         if (!hit) return;
 
         const now = performance.now();
         const dt = this._lastMouseMoveTime > 0
             ? Math.min((now - this._lastMouseMoveTime) / 1000, 0.05)
             : 0.016;
         this._lastMouseMoveTime = now;
 
         if (dt > 0) {
             const rawVel = Ragdoll3DCore._scratchVec3B
                 .subVectors(pos, this.lastMousePos)
                 .divideScalar(dt);
             // lerp 0.7: más responsivo que 0.4, evita que lanzamientos rápidos
             // queden amortiguados por el suavizado
             this.mouseVelocity.lerp(rawVel, 0.7);
         }
         this.lastMousePos.copy(pos);
 
         this.mouseAnchorBody.setNextKinematicTranslation(pos);
         this.rigidBodies.forEach(body => body.wakeUp());
     }
 
     protected onMouseUp(): void {
         if (!this.grabbedBody || !this.world) return;
 
         this.grabbedBody.wakeUp();
 
         if (this.mouseJoint) {
             this.world.removeImpulseJoint(this.mouseJoint, true);
             this.mouseJoint = null;
         }
         if (this.mouseAnchorBody) {
             this.world.removeRigidBody(this.mouseAnchorBody);
             this.mouseAnchorBody = null;
         }
 
         const mem = Services.get('RagdollMemory');
         if (mem) mem.recordDrop();
 
         // Aplicar velocidad de lanzamiento solo si el usuario realmente arrastró.
         // Si mouseVelocity es casi cero (soltó sin mover), no aplicar nada —
         // dejar que la gravedad tome el control sin interferencia.
         const throwVel = this.mouseVelocity.clone().multiplyScalar(1.5);
         const speed = throwVel.length();
 
         if (speed > 0.5) {
             const hipsBody = this.rigidBodies.get('Hips');
             const hipsPos = hipsBody
                 ? new THREE.Vector3(
                     hipsBody.translation().x,
                     hipsBody.translation().y,
                     hipsBody.translation().z
                   )
                 : new THREE.Vector3();
 
             this.rigidBodies.forEach((body) => {
                 const t = body.translation();
                 const dist = new THREE.Vector3(t.x, t.y, t.z).distanceTo(hipsPos);
                 const falloff = Math.max(0.6, 1.0 - dist * 0.08);
                 body.setLinvel(
                     { x: throwVel.x * falloff, y: throwVel.y * falloff, z: throwVel.z * falloff },
                     true
                 );
                 body.wakeUp();
             });
 
             if (speed > 4) {
                 if (this.audioManager) this.audioManager.play('scream', { volume: 0.4 });
                 this.say('¡AHHHH!', 2000);
                 const memHurt = Services.get('RagdollMemory');
                 if (memHurt) memHurt.recordHurt();
             }
         }

        this._lastMouseMoveTime = 0;
        this.mouseVelocity.set(0, 0, 0);
        this.grabbedBody = null;
    }
}