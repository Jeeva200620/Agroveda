/**
 * AgroVeda 3D Agricultural Digital Twin (High-Fidelity Botanical Engine)
 * Features:
 * 1. Species-Specific Botanical Geometries (Bell Pepper, Tomato, Potato).
 * 2. Clinical Pathological Texture Shaders (Bacterial Spots with Yellow Halos, Target Rings, Water-soaked Blight).
 * 3. Macro-to-Micro Plant Inspector: Click any plant to zoom into close-up 3D leaf/fruit pathology.
 * 4. 30-Day Epidemiological timeline scrubber with interactive orbit controls.
 */

class FarmTwin3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.plants = {};
        this.timeline = {};
        this.currentDay = 1;
        this.diseaseName = "Tomato_Early_blight";
        this.cropType = "tomato"; // "pepper", "tomato", "potato"

        // Camera Orbit & Inspection States
        this.isMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetRotationY = 0.45;
        this.targetRotationX = 0.58;
        this.isInspecting = false;
        this.inspectedPlantKey = null;

        // Camera Animation Vectors
        this.currentCamPos = new THREE.Vector3(0, 14, 18);
        this.targetCamPos = new THREE.Vector3(0, 14, 18);
        this.currentLookAt = new THREE.Vector3(0, 0, 0);
        this.targetLookAt = new THREE.Vector3(0, 0, 0);

        // Pre-generated symptom texture palettes
        this.textures = this.createProceduralSymptomTextures();

        this.init();
    }

    createProceduralSymptomTextures() {
        const createTex = (drawFn) => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            drawFn(ctx);
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            return tex;
        };

        // 1. Healthy Leaf Texture (Lush green with subtle vein lines)
        const healthyTex = createTex((ctx) => {
            ctx.fillStyle = '#1e782d';
            ctx.fillRect(0, 0, 256, 256);
            ctx.strokeStyle = '#2bbb42';
            ctx.lineWidth = 3;
            // Primary & secondary veins
            ctx.beginPath();
            ctx.moveTo(128, 0); ctx.lineTo(128, 256);
            for (let y = 30; y < 256; y += 40) {
                ctx.moveTo(128, y); ctx.lineTo(30, y + 25);
                ctx.moveTo(128, y); ctx.lineTo(226, y + 25);
            }
            ctx.stroke();
        });

        // 2. Bacterial Spot Texture (Dark necrotic pustules with yellow chlorotic halos)
        const bacterialSpotTex = createTex((ctx) => {
            ctx.fillStyle = '#2f6333';
            ctx.fillRect(0, 0, 256, 256);
            // Draw scattered pustules
            const spots = [[60, 50, 18], [180, 80, 22], [90, 170, 25], [190, 190, 16], [130, 120, 20]];
            spots.forEach(([x, y, r]) => {
                // Yellow chlorotic halo
                const grad = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 1.4);
                grad.addColorStop(0, '#1c1208');     // Necrotic core
                grad.addColorStop(0.5, '#4a2c0f');   // Dark brown margin
                grad.addColorStop(0.8, '#eab308');   // Chlorotic yellow halo
                grad.addColorStop(1, 'transparent'); // Blend into leaf
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(x, y, r * 1.4, 0, Math.PI * 2);
                ctx.fill();
            });
        });

        // 3. Early Blight Texture (Concentric target-board rings)
        const targetBlightTex = createTex((ctx) => {
            ctx.fillStyle = '#3d6132';
            ctx.fillRect(0, 0, 256, 256);
            const rings = [[100, 100, 35], [170, 170, 30]];
            rings.forEach(([cx, cy, maxR]) => {
                for (let r = maxR; r > 5; r -= 7) {
                    ctx.strokeStyle = (r % 14 === 0) ? '#180e05' : '#78350f';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });
        });

        // 4. Late Blight Texture (Large water-soaked dark decaying blotches)
        const lateBlightTex = createTex((ctx) => {
            ctx.fillStyle = '#284625';
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#1c150c';
            ctx.beginPath();
            ctx.ellipse(128, 128, 90, 60, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#854d0e';
            ctx.lineWidth = 8;
            ctx.stroke();
        });

        return {
            healthy: healthyTex,
            bacterial_spot: bacterialSpotTex,
            early_blight: targetBlightTex,
            late_blight: lateBlightTex
        };
    }

    init() {
        const width = this.container.clientWidth || 650;
        const height = this.container.clientHeight || 340;

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a120e); // Premium agro-dark aesthetic

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        this.camera.position.copy(this.currentCamPos);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const hemiLight = new THREE.HemisphereLight(0xdcfce7, 0x142e1b, 0.9);
        this.scene.add(hemiLight);

        const sun = new THREE.DirectionalLight(0xfff7ed, 1.4);
        sun.position.set(12, 20, 10);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 1024;
        sun.shadow.mapSize.height = 1024;
        this.scene.add(sun);

        // Ground Plane (Agricultural Furrows / Loam)
        const groundGeo = new THREE.PlaneGeometry(18, 18, 32, 32);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x24180d,
            roughness: 0.95,
            metalness: 0.05
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Build Default Farm Grid
        this.buildFarmGrid();

        // Mouse Drag / Touch / Click-to-Inspect Setup
        this.setupInteraction();

        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Start render loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    determineCropType(diseaseName) {
        const d = (diseaseName || "").toLowerCase();
        if (d.includes("pepper")) return "pepper";
        if (d.includes("potato")) return "potato";
        return "tomato";
    }

    getSymptomTexture(diseaseName) {
        const d = (diseaseName || "").toLowerCase();
        if (d.includes("bacterial")) return this.textures.bacterial_spot;
        if (d.includes("early")) return this.textures.early_blight;
        if (d.includes("late")) return this.textures.late_blight;
        return this.textures.bacterial_spot;
    }

    buildFarmGrid() {
        // Clear any existing plants
        for (const p of Object.values(this.plants)) {
            this.scene.remove(p);
        }
        this.plants = {};

        const rows = 10;
        const cols = 10;
        const spacing = 1.35;
        const offsetX = -((cols - 1) * spacing) / 2;
        const offsetZ = -((rows - 1) * spacing) / 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const plantGroup = this.createBotanicalPlantMesh(this.cropType, r, c);
                plantGroup.position.set(offsetX + c * spacing, 0, offsetZ + r * spacing);
                this.scene.add(plantGroup);
                this.plants[`plant_${r}_${c}`] = plantGroup;
            }
        }
    }

    /**
     * Procedural Species-Specific Botanical Generator
     */
    createBotanicalPlantMesh(type, row, col) {
        const group = new THREE.Group();
        group.userData = {
            key: `plant_${row}_${col}`,
            row: row,
            col: col,
            type: type,
            leafMeshes: [],
            fruitMeshes: []
        };

        const stemMat = new THREE.MeshStandardMaterial({ color: 0x2b4c2f, roughness: 0.8 });
        const leafMat = new THREE.MeshStandardMaterial({
            map: this.textures.healthy,
            roughness: 0.6,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        if (type === "pepper") {
            // === 1. BELL PEPPER (Capsicum annuum) ===
            // Upright central woody stem
            const stemGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.9, 6);
            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.y = 0.45;
            stem.castShadow = true;
            group.add(stem);

            // Broad elliptical leaves on angled branch petioles
            const leafGeo = new THREE.SphereGeometry(0.24, 6, 4);
            leafGeo.scale(1.2, 0.1, 0.6); // Flatten into ovate leaf

            const leafAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, Math.PI / 4, (5 * Math.PI) / 4];
            leafAngles.forEach((angle, i) => {
                const lMat = leafMat.clone();
                const leaf = new THREE.Mesh(leafGeo, lMat);
                const h = 0.35 + (i * 0.08);
                leaf.position.set(Math.cos(angle) * 0.28, h, Math.sin(angle) * 0.28);
                leaf.rotation.set(0.3, angle, 0.35);
                leaf.castShadow = true;
                group.add(leaf);
                group.userData.leafMeshes.push(leaf);
            });

            // Hanging 3D Bell Peppers (4-lobed tapered shape with green calyx)
            const pepperGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.25, 8);
            pepperGeo.scale(1.0, 1.0, 0.85);
            const pepperMat = new THREE.MeshStandardMaterial({
                color: 0x15803d, // Glossy green bell pepper
                roughness: 0.3,
                metalness: 0.2
            });

            const p1 = new THREE.Mesh(pepperGeo, pepperMat.clone());
            p1.position.set(0.16, 0.4, 0.12);
            p1.rotation.x = Math.PI * 0.9;
            p1.castShadow = true;
            group.add(p1);
            group.userData.fruitMeshes.push(p1);

            const p2 = new THREE.Mesh(pepperGeo, pepperMat.clone());
            p2.position.set(-0.14, 0.5, -0.1);
            p2.rotation.z = -Math.PI * 0.85;
            p2.castShadow = true;
            group.add(p2);
            group.userData.fruitMeshes.push(p2);

        } else if (type === "potato") {
            // === 2. POTATO (Solanum tuberosum) ===
            // Low spreading canopy with multiple main branches
            const stemAngles = [0, 1.2, 2.4, 3.6, 4.8];
            stemAngles.forEach((ang) => {
                const sGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.65, 5);
                const bStem = new THREE.Mesh(sGeo, stemMat);
                bStem.position.set(Math.cos(ang) * 0.12, 0.3, Math.sin(ang) * 0.12);
                bStem.rotation.set(Math.sin(ang) * 0.35, ang, Math.cos(ang) * 0.35);
                group.add(bStem);
            });

            // Compound serrated leaflets
            const pLeafGeo = new THREE.ConeGeometry(0.22, 0.45, 5);
            pLeafGeo.scale(1.0, 0.15, 0.8);

            for (let i = 0; i < 9; i++) {
                const pMat = leafMat.clone();
                const l = new THREE.Mesh(pLeafGeo, pMat);
                const th = (i / 9) * Math.PI * 2;
                l.position.set(Math.cos(th) * 0.38, 0.35 + (i % 3) * 0.1, Math.sin(th) * 0.38);
                l.rotation.set(0.4, th, 0.2);
                l.castShadow = true;
                group.add(l);
                group.userData.leafMeshes.push(l);
            }

            // Soil ridge mound around base
            const ridgeGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.12, 8);
            const ridge = new THREE.Mesh(ridgeGeo, new THREE.MeshStandardMaterial({ color: 0x3b2413, roughness: 1.0 }));
            ridge.position.y = 0.06;
            group.add(ridge);

        } else {
            // === 3. TOMATO (Solanum lycopersicum) ===
            // Tall indeterminate vine stem
            const stemGeo = new THREE.CylinderGeometry(0.05, 0.08, 1.1, 6);
            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.y = 0.55;
            stem.rotation.z = 0.06;
            stem.castShadow = true;
            group.add(stem);

            // Serrated leaflets along nodes
            const tLeafGeo = new THREE.BoxGeometry(0.38, 0.04, 0.22);
            for (let i = 0; i < 8; i++) {
                const tMat = leafMat.clone();
                const lf = new THREE.Mesh(tLeafGeo, tMat);
                const angle = i * 0.8;
                lf.position.set(Math.cos(angle) * 0.3, 0.25 + (i * 0.11), Math.sin(angle) * 0.3);
                lf.rotation.set(0.25, angle, 0.3);
                lf.castShadow = true;
                group.add(lf);
                group.userData.leafMeshes.push(lf);
            }

            // Cluster of round 3D Tomatoes
            const tomatoGeo = new THREE.SphereGeometry(0.09, 8, 8);
            const tomatoMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.25 }); // Unripe green

            const tom1 = new THREE.Mesh(tomatoGeo, tomatoMat.clone());
            tom1.position.set(0.12, 0.5, 0.12);
            group.add(tom1);
            group.userData.fruitMeshes.push(tom1);

            const tom2 = new THREE.Mesh(tomatoGeo, tomatoMat.clone());
            tom2.position.set(0.18, 0.46, 0.08);
            group.add(tom2);
            group.userData.fruitMeshes.push(tom2);
        }

        return group;
    }

    setupInteraction() {
        const el = this.renderer.domElement;

        el.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.clickStartX = e.clientX;
            this.clickStartY = e.clientY;
        });

        window.addEventListener('mouseup', (e) => {
            this.isMouseDown = false;
            // Detect if this was a click (not a drag) for Plant Inspector
            const dist = Math.hypot(e.clientX - this.clickStartX, e.clientY - this.clickStartY);
            if (dist < 5) {
                this.handlePlantClick(e);
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isMouseDown || this.isInspecting) return;
            const deltaX = e.clientX - this.mouseX;
            const deltaY = e.clientY - this.mouseY;
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;

            this.targetRotationY += deltaX * 0.008;
            this.targetRotationX = Math.max(0.2, Math.min(1.2, this.targetRotationX + deltaY * 0.008));
        });

        // Touch support
        el.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.isMouseDown = true;
                this.mouseX = e.touches[0].clientX;
                this.mouseY = e.touches[0].clientY;
            }
        });

        window.addEventListener('touchend', () => {
            this.isMouseDown = false;
        });

        window.addEventListener('touchmove', (e) => {
            if (!this.isMouseDown || e.touches.length !== 1 || this.isInspecting) return;
            const deltaX = e.touches[0].clientX - this.mouseX;
            const deltaY = e.touches[0].clientY - this.mouseY;
            this.mouseX = e.touches[0].clientX;
            this.mouseY = e.touches[0].clientY;

            this.targetRotationY += deltaX * 0.008;
            this.targetRotationX = Math.max(0.2, Math.min(1.2, this.targetRotationX + deltaY * 0.008));
        });
    }

    /**
     * Macro-to-Micro Click-to-Zoom Plant Inspector
     */
    handlePlantClick(e) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            let hitObj = intersects[0].object;
            while (hitObj.parent && !hitObj.userData.key) {
                hitObj = hitObj.parent;
            }

            if (hitObj && hitObj.userData && hitObj.userData.key) {
                this.zoomIntoPlant(hitObj);
            }
        }
    }

    zoomIntoPlant(plantGroup) {
        this.isInspecting = true;
        this.inspectedPlantKey = plantGroup.userData.key;
        const targetPos = plantGroup.position;

        // Position camera right in front of the plant's foliage
        this.targetCamPos.set(targetPos.x, targetPos.y + 0.85, targetPos.z + 1.8);
        this.targetLookAt.set(targetPos.x, targetPos.y + 0.5, targetPos.z);

        // Update UI HUD badge
        const dayInfected = this.timeline[this.inspectedPlantKey];
        const statusText = (dayInfected !== undefined && dayInfected <= this.currentDay)
            ? `<span class="text-error font-bold">Infected (Day ${dayInfected})</span>`
            : `<span class="text-primary font-bold">Healthy (No Lesions)</span>`;

        let inspectorHUD = document.getElementById('plant-inspector-hud');
        if (!inspectorHUD) {
            inspectorHUD = document.createElement('div');
            inspectorHUD.id = 'plant-inspector-hud';
            inspectorHUD.className = 'absolute bottom-3 left-3 right-3 bg-black/85 backdrop-blur-md p-3 rounded-xl border border-primary/30 flex items-center justify-between text-xs text-white z-20 shadow-lg';
            this.container.appendChild(inspectorHUD);
        }

        const cropLabel = this.cropType === 'pepper' ? 'Bell Pepper (குடைமிளகாய்)' : (this.cropType === 'potato' ? 'Potato (உருளை)' : 'Tomato (தக்காளி)');

        inspectorHUD.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary text-xl">biotech</span>
                <div>
                    <span class="font-bold block">${cropLabel} • Row ${plantGroup.userData.row + 1}, Col ${plantGroup.userData.col + 1}</span>
                    <span class="text-[11px] text-white/80">${statusText} • Drag to inspect foliage & fruit</span>
                </div>
            </div>
            <button id="reset-cam-btn" class="px-3 py-1 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-container transition-all flex items-center gap-1 cursor-pointer">
                <span class="material-symbols-outlined text-sm">grid_view</span> Field View
            </button>
        `;

        inspectorHUD.style.display = 'flex';
        const resetBtn = document.getElementById('reset-cam-btn');
        if (resetBtn) {
            resetBtn.onclick = () => this.resetFieldView();
        }
    }

    resetFieldView() {
        this.isInspecting = false;
        this.inspectedPlantKey = null;
        this.targetLookAt.set(0, 0, 0);

        const hud = document.getElementById('plant-inspector-hud');
        if (hud) hud.style.display = 'none';
    }

    loadSimulation(timeline, diseaseName, stats) {
        this.timeline = timeline || {};
        this.diseaseName = diseaseName || "Tomato_Early_blight";
        this.cropType = this.determineCropType(this.diseaseName);

        // Rebuild grid with the correct botanical species!
        this.buildFarmGrid();

        this.currentDay = 1;
        this.updateDay(1);

        const badge = document.getElementById('twin-disease-badge');
        if (badge && diseaseName) {
            badge.textContent = diseaseName.replace(/___|__|_/g, ' ');
        }
    }

    updateDay(day) {
        this.currentDay = parseInt(day, 10);
        let infectedCount = 0;
        const symptomTex = this.getSymptomTexture(this.diseaseName);

        for (const [key, plant] of Object.entries(this.plants)) {
            const dayInfected = this.timeline[key];
            const isInfected = (dayInfected !== undefined && dayInfected <= this.currentDay);

            if (isInfected) infectedCount++;

            // Update Leaf Shaders with Pathological Textures
            if (plant.userData && plant.userData.leafMeshes) {
                plant.userData.leafMeshes.forEach(leaf => {
                    if (isInfected) {
                        leaf.material.map = symptomTex;
                        leaf.material.color.setHex(0xe2e8f0); // Neutral multiplier to show rich texture
                        leaf.material.roughness = 0.9;
                    } else {
                        leaf.material.map = this.textures.healthy;
                        leaf.material.color.setHex(0xffffff);
                        leaf.material.roughness = 0.5;
                    }
                    leaf.material.needsUpdate = true;
                });
            }

            // Update Fruit Shaders (Necrotic brown scabs or rotting if infected)
            if (plant.userData && plant.userData.fruitMeshes) {
                plant.userData.fruitMeshes.forEach(fruit => {
                    if (isInfected) {
                        fruit.material.color.setHex(0x573919); // Sunken brown rot
                        fruit.material.roughness = 0.9;
                    } else {
                        fruit.material.color.setHex(this.cropType === 'pepper' ? 0x15803d : 0x16a34a);
                        fruit.material.roughness = 0.25;
                    }
                    fruit.material.needsUpdate = true;
                });
            }
        }

        // Update UI counters
        const dayCounter = document.getElementById('day-counter');
        if (dayCounter) {
            dayCounter.textContent = `Simulation: Day ${this.currentDay} / 30`;
        }

        const affectedCount = document.getElementById('affected-count');
        if (affectedCount) {
            affectedCount.textContent = `${infectedCount} / 100 Crops Affected (${infectedCount}%)`;
        }
    }

    onWindowResize() {
        if (!this.container || !this.renderer) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight || 340;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate(time) {
        requestAnimationFrame(this.animate);

        // Smooth Camera Interpolation (Lerp)
        if (!this.isInspecting) {
            const radius = 22;
            this.targetCamPos.x = radius * Math.sin(this.targetRotationY) * Math.cos(this.targetRotationX);
            this.targetCamPos.z = radius * Math.cos(this.targetRotationY) * Math.cos(this.targetRotationX);
            this.targetCamPos.y = radius * Math.sin(this.targetRotationX);
        }

        this.currentCamPos.lerp(this.targetCamPos, 0.08);
        this.currentLookAt.lerp(this.targetLookAt, 0.08);

        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.currentLookAt);

        // Gentle botanical wind sway on foliage
        const t = time * 0.002;
        for (const plant of Object.values(this.plants)) {
            plant.rotation.y = Math.sin(t + plant.userData.row) * 0.03;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Global exposure
window.FarmTwin3D = FarmTwin3D;
