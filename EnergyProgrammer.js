/**
 * EnergyProgrammer.js
 * 
 * A class to handle energy programming for Conical Kresling Origami
 */
class EnergyProgrammer {
    /**
     * Creates a new energy programmer
     * @param {string} visualizationContainerId - ID of the visualization container
     */
    constructor(visualizationContainerId) {
        this.visualizationContainer = document.getElementById(visualizationContainerId);
        this.width = this.visualizationContainer.clientWidth;
        this.height = this.visualizationContainer.clientHeight;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        this.numLayers = 2;
        this.numCells = 6;
        
        this.layerParameters = []; // Target parameters for each layer
        this.optimizedParameters = []; // Optimized parameters
        
        this.kreslingModels = []; // KreslingModel instances for each layer
        this.kreslingGroup = null; // Group containing all layers
        
        this.energyChart = null;
        
        this.init();
        this.initEnergyChart();
        this.initLayerTargetParameters();
        this.bindEvents();
    }
    
    /**
     * Initialize the 3D scene
     */
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f4f8);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);
        this.camera.position.set(10, 10, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.visualizationContainer.appendChild(this.renderer.domElement);
        
        // Create orbit controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        this.controls.rotateSpeed = 0.5;
        
        // Create lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight1.position.set(5, 10, 7.5);
        this.scene.add(directionalLight1);
        
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLight2.position.set(-5, -10, -7.5);
        this.scene.add(directionalLight2);
        
        // Create axes helper (for debugging)
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
        
        // Create group for Kresling models
        this.kreslingGroup = new THREE.Group();
        this.scene.add(this.kreslingGroup);
        
        // Initial rendering
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    /**
     * Initialize the energy landscape chart
     */
    initEnergyChart() {
        const ctx = document.getElementById('energy-landscape-chart').getContext('2d');
        
        this.energyChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Energy Landscape',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Height: ${context.parsed.x.toFixed(2)}, Energy: ${context.parsed.y.toFixed(4)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Total Height'
                        }
                    },
                    y: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Energy'
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Initialize layer target parameters UI
     */
    initLayerTargetParameters() {
        const container = document.getElementById('layer-target-parameters');
        container.innerHTML = '';
        
        // Default parameters for each layer
        this.layerParameters = [];
        
        for (let i = 0; i < this.numLayers; i++) {
            this.layerParameters.push({
                h1: 0.8 - 0.2 * i, // Decreasing heights
                h2: 0,            // Zero for folded state
                energyBarrier: 0.001 * (i + 1) // Increasing energy barriers
            });
            
            const layerDiv = document.createElement('div');
            layerDiv.className = 'layer-target';
            layerDiv.innerHTML = `
                <h4>Layer ${i + 1}</h4>
                <div class="parameter-group">
                    <label for="h1-layer-${i}">Deployed Height (h₁):</label>
                    <input type="range" id="h1-layer-${i}" min="0.2" max="1.0" value="${this.layerParameters[i].h1}" step="0.1">
                    <span class="parameter-value" id="h1-layer-${i}-value">${this.layerParameters[i].h1.toFixed(1)}</span>
                </div>
                <div class="parameter-group">
                    <label for="h2-layer-${i}">Folded Height (h₂):</label>
                    <input type="range" id="h2-layer-${i}" min="0" max="0.5" value="${this.layerParameters[i].h2}" step="0.1">
                    <span class="parameter-value" id="h2-layer-${i}-value">${this.layerParameters[i].h2.toFixed(1)}</span>
                </div>
                <div class="parameter-group">
                    <label for="energy-layer-${i}">Energy Barrier:</label>
                    <input type="range" id="energy-layer-${i}" min="0.0001" max="0.01" value="${this.layerParameters[i].energyBarrier}" step="0.0001">
                    <span class="parameter-value" id="energy-layer-${i}-value">${this.layerParameters[i].energyBarrier.toFixed(4)}</span>
                </div>
            `;
            
            container.appendChild(layerDiv);
            
            // Add event listeners for sliders
            document.getElementById(`h1-layer-${i}`).addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.layerParameters[i].h1 = value;
                document.getElementById(`h1-layer-${i}-value`).textContent = value.toFixed(1);
            });
            
            document.getElementById(`h2-layer-${i}`).addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.layerParameters[i].h2 = value;
                document.getElementById(`h2-layer-${i}-value`).textContent = value.toFixed(1);
            });
            
            document.getElementById(`energy-layer-${i}`).addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.layerParameters[i].energyBarrier = value;
                document.getElementById(`energy-layer-${i}-value`).textContent = value.toFixed(4);
            });
        }
    }
    
    /**
     * Bind event handlers
     */
    bindEvents() {
        // Number of layers slider
        document.getElementById('energy-layers-slider').addEventListener('input', (e) => {
            this.numLayers = parseInt(e.target.value);
            document.getElementById('energy-layers-value').textContent = this.numLayers;
            this.initLayerTargetParameters();
        });
        
        // Number of cells slider
        document.getElementById('energy-cells-slider').addEventListener('input', (e) => {
            this.numCells = parseInt(e.target.value);
            document.getElementById('energy-cells-value').textContent = this.numCells;
        });
        
        // Calculate design button
        document.getElementById('calculate-energy-btn').addEventListener('click', () => {
            this.calculateDesign();
        });
        
        // Animate folding button
        document.getElementById('animate-folding-btn').addEventListener('click', () => {
            this.animateFolding();
        });
        
        // Export design button
        document.getElementById('export-energy-design-btn').addEventListener('click', () => {
            this.exportDesign();
        });
    }
    
    /**
     * Handle window resize
     */
    onWindowResize() {
        this.width = this.visualizationContainer.clientWidth;
        this.height = this.visualizationContainer.clientHeight;
        
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(this.width, this.height);
    }
    
    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Calculate the design based on target parameters
     */
    calculateDesign() {
        // Clear optimization info
        document.getElementById('optimization-info').innerHTML = '<p>Calculating design parameters...</p>';
        
        // Clear existing models
        this.clearKreslingModels();
        
        // Perform optimization to find parameters that satisfy target requirements
        this.optimizeParameters();
        
        // Create new models with optimized parameters
        this.createKreslingModels();
        
        // Update energy chart
        this.updateEnergyChart();
        
        // Update parameters table
        this.updateParametersTable();
        
        // Update optimization info
        document.getElementById('optimization-info').innerHTML = '<p>Design calculation completed successfully!</p>';
    }
    
    /**
     * Clear existing Kresling models from the scene
     */
    clearKreslingModels() {
        while (this.kreslingGroup.children.length > 0) {
            const child = this.kreslingGroup.children[0];
            this.kreslingGroup.remove(child);
            
            if (child.geometry) {
                child.geometry.dispose();
            }
            
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
        
        this.kreslingModels = [];
    }
    
    /**
     * Optimize parameters to meet target requirements
     */
    optimizeParameters() {
        // This is a placeholder for the actual optimization algorithm
        // In a real implementation, this would use the optimization method from the paper
        
        this.optimizedParameters = [];
        
        // Simple example values for bilayer CKO from the paper
        if (this.numLayers === 2 && this.numCells === 6) {
            // Values taken from the paper for bilayer CKO
            this.optimizedParameters = [
                {
                    b1: 1.0371,
                    b2: 0.4715,
                    c: 1.0,
                    beta: 1.5130,
                    h1: this.layerParameters[0].h1,
                    h2: this.layerParameters[0].h2,
                    energyBarrier: this.layerParameters[0].energyBarrier
                },
                {
                    b1: 0.4715,
                    b2: 0.2640,
                    c: 0.5064,
                    beta: 1.5894,
                    h1: this.layerParameters[1].h1,
                    h2: this.layerParameters[1].h2,
                    energyBarrier: this.layerParameters[1].energyBarrier
                }
            ];
        } else {
            // Generate reasonable parameters for other configurations
            for (let i = 0; i < this.numLayers; i++) {
                const h1 = this.layerParameters[i].h1;
                const h2 = this.layerParameters[i].h2;
                const energyBarrier = this.layerParameters[i].energyBarrier;
                
                // Scale parameters based on layer
                const scaleFactor = 1.0 - 0.1 * i;
                
                this.optimizedParameters.push({
                    b1: 1.0 * scaleFactor,
                    b2: 0.5 * scaleFactor,
                    c: 0.8 * scaleFactor,
                    beta: 1.5 + 0.05 * i,
                    h1: h1,
                    h2: h2,
                    energyBarrier: energyBarrier
                });
            }
        }
    }
    
    /**
     * Create Kresling models with optimized parameters
     */
    createKreslingModels() {
        // Materials
        const faceMaterials = [
            new THREE.MeshPhongMaterial({ 
                color: 0xe3f2fd, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8,
                flatShading: true
            }),
            new THREE.MeshPhongMaterial({ 
                color: 0xbbdefb, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8,
                flatShading: true
            }),
            new THREE.MeshPhongMaterial({ 
                color: 0x90caf9, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8,
                flatShading: true
            })
        ];
        
        const mountainMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 });
        const valleyMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
        const frameMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 3 });
        
        let zOffset = 0;
        
        // Create a model for each layer
        for (let i = 0; i < this.optimizedParameters.length; i++) {
            const params = this.optimizedParameters[i];
            
            // Create Kresling model
            const model = new KreslingModel({
                n: this.numCells,
                a: params.b2, // Top edge length is bottom edge length of next layer
                b: params.b1, // Bottom edge length
                c: params.c,  // Side edge length (mountain crease)
                beta: params.beta // Angle between bottom edge and mountain crease
            });
            
            this.kreslingModels.push(model);
            
            // Get vertex coordinates for the deployed state
            const { topVertices, bottomVertices } = model.getVertexCoordinates(params.h1, model.findStableStates().state1?.phi || 0);
            
            // Create layer geometry
            const layerGeometry = new THREE.BufferGeometry();
            const vertices = [];
            const faces = [];
            
            // Shift vertices by zOffset
            const bottomVerticesShifted = bottomVertices.map(v => [v[0], v[1], v[2] + zOffset]);
            const topVerticesShifted = topVertices.map(v => [v[0], v[1], v[2] + zOffset]);
            
            // Create faces
            for (let j = 0; j < this.numCells; j++) {
                const nextJ = (j + 1) % this.numCells;
                
                // Bottom vertex, top vertex, next bottom vertex
                vertices.push(
                    ...bottomVerticesShifted[j],
                    ...topVerticesShifted[j],
                    ...bottomVerticesShifted[nextJ]
                );
                
                // Top vertex, next top vertex, next bottom vertex
                vertices.push(
                    ...topVerticesShifted[j],
                    ...topVerticesShifted[nextJ],
                    ...bottomVerticesShifted[nextJ]
                );
            }
            
            // Set vertices and compute normals
            layerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            layerGeometry.computeVertexNormals();
            
            // Create layer mesh
            const layerMesh = new THREE.Mesh(layerGeometry, faceMaterials[i % faceMaterials.length]);
            this.kreslingGroup.add(layerMesh);
            
            // Add mountain and valley creases
            for (let j = 0; j < this.numCells; j++) {
                const nextJ = (j + 1) % this.numCells;
                
                // Mountain crease (bottom to top)
                const mountainGeometry = new THREE.BufferGeometry();
                mountainGeometry.setFromPoints([
                    new THREE.Vector3(...bottomVerticesShifted[j]),
                    new THREE.Vector3(...topVerticesShifted[j])
                ]);
                const mountainLine = new THREE.Line(mountainGeometry, mountainMaterial);
                this.kreslingGroup.add(mountainLine);
                
                // Valley crease (bottom to next top)
                const valleyGeometry = new THREE.BufferGeometry();
                valleyGeometry.setFromPoints([
                    new THREE.Vector3(...bottomVerticesShifted[j]),
                    new THREE.Vector3(...topVerticesShifted[nextJ])
                ]);
                const valleyLine = new THREE.Line(valleyGeometry, valleyMaterial);
                this.kreslingGroup.add(valleyLine);
            }
            
            // Add top and bottom frames
            const topFrameGeometry = new THREE.BufferGeometry();
            const topFramePoints = topVerticesShifted.map(v => new THREE.Vector3(...v));
            topFrameGeometry.setFromPoints([...topFramePoints, topFramePoints[0]]);
            const topFrame = new THREE.Line(topFrameGeometry, frameMaterial);
            this.kreslingGroup.add(topFrame);
            
            const bottomFrameGeometry = new THREE.BufferGeometry();
            const bottomFramePoints = bottomVerticesShifted.map(v => new THREE.Vector3(...v));
            bottomFrameGeometry.setFromPoints([...bottomFramePoints, bottomFramePoints[0]]);
            const bottomFrame = new THREE.Line(bottomFrameGeometry, frameMaterial);
            this.kreslingGroup.add(bottomFrame);
            
            // Update zOffset for next layer
            zOffset += params.h1;
        }
    }
    
    /**
     * Update the energy landscape chart
     */
    updateEnergyChart() {
        // Clear existing datasets
        this.energyChart.data.datasets = [];
        
        // Calculate cumulative energy landscape
        const totalSteps = 100;
        const totalHeight = this.optimizedParameters.reduce((sum, params) => sum + params.h1, 0);
        const hStep = totalHeight / totalSteps;
        
        // Calculate energy for the whole structure
        const energyData = [];
        
        for (let i = 0; i <= totalSteps; i++) {
            const h = i * hStep;
            
            // Distribute height proportionally among layers
            const layerHeights = this.distributeHeight(h);
            
            // Calculate total energy
            let totalEnergy = 0;
            
            for (let j = 0; j < this.kreslingModels.length; j++) {
                const model = this.kreslingModels[j];
                const phi = model.findEquilibriumTwistAngle(layerHeights[j]);
                totalEnergy += model.computeEnergy(layerHeights[j], phi);
            }
            
            energyData.push({ x: h, y: totalEnergy });
        }
        
        // Add energy curve for the whole structure
        this.energyChart.data.datasets.push({
            label: 'Total Energy',
            data: energyData,
            borderColor: '#0d47a1',
            backgroundColor: 'rgba(13, 71, 161, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.1
        });
        
        // Add markers for stable states
        const stableHeights = [];
        let cumulativeHeight = 0;
        
        // First stable state (all layers deployed)
        stableHeights.push({
            x: totalHeight,
            y: 0
        });
        
        // Intermediate stable states
        for (let i = 0; i < this.optimizedParameters.length - 1; i++) {
            cumulativeHeight += this.optimizedParameters[i].h2;
            
            for (let j = i + 1; j < this.optimizedParameters.length; j++) {
                cumulativeHeight += this.optimizedParameters[j].h1;
            }
            
            stableHeights.push({
                x: cumulativeHeight,
                y: 0
            });
            
            cumulativeHeight = 0;
        }
        
        // Final stable state (all layers folded)
        const finalHeight = this.optimizedParameters.reduce((sum, params) => sum + params.h2, 0);
        stableHeights.push({
            x: finalHeight,
            y: 0
        });
        
        // Add stable state markers
        this.energyChart.data.datasets.push({
            label: 'Stable States',
            data: stableHeights,
            backgroundColor: '#4caf50',
            borderColor: '#4caf50',
            pointRadius: 6,
            pointHoverRadius: 8,
            showLine: false
        });
        
        // Update chart
        this.energyChart.update();
    }
    
    /**
     * Distribute a total height among layers based on their deployed heights
     * @param {number} totalHeight - Total height to distribute
     * @returns {Array} Array of heights for each layer
     */
    distributeHeight(totalHeight) {
        const deployedHeights = this.optimizedParameters.map(params => params.h1);
        const totalDeployedHeight = deployedHeights.reduce((sum, h) => sum + h, 0);
        
        // If total height is greater than total deployed height, limit to deployed heights
        if (totalHeight >= totalDeployedHeight) {
            return deployedHeights;
        }
        
        // Distribute height proportionally
        const ratio = totalHeight / totalDeployedHeight;
        return deployedHeights.map(h => h * ratio);
    }
    
    /**
     * Update the parameters table with optimized parameters
     */
    updateParametersTable() {
        const tableBody = document.getElementById('energy-parameters-body');
        tableBody.innerHTML = '';
        
        this.optimizedParameters.forEach((params, index) => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${params.b1.toFixed(4)}</td>
                <td>${params.b2.toFixed(4)}</td>
                <td>${params.c.toFixed(4)}</td>
                <td>${params.beta.toFixed(4)}</td>
                <td>${params.h1.toFixed(4)}</td>
                <td>${params.h2.toFixed(4)}</td>
                <td>${params.energyBarrier.toFixed(4)}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    /**
     * Animate the folding sequence
     */
    animateFolding() {
        if (!this.kreslingModels || this.kreslingModels.length === 0) {
            alert('Please calculate design parameters first.');
            return;
        }
        
        // Animation parameters
        const duration = 2000 * this.numLayers; // Duration in milliseconds
        const startTime = Date.now();
        
        // Get stable states
        const stableStates = this.kreslingModels.map((model, i) => {
            const modelStates = model.findStableStates();
            return {
                deployed: {
                    h: this.optimizedParameters[i].h1,
                    phi: modelStates.state1?.phi || 0
                },
                folded: {
                    h: this.optimizedParameters[i].h2,
                    phi: modelStates.state2?.phi || Math.PI / 2
                }
            };
        });
        
        // Animation function
        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            
            if (elapsed < duration) {
                // Clear existing models
                this.clearKreslingModels();
                
                // Determine which layer is currently folding
                const foldingLayerIndex = Math.floor(elapsed / (duration / this.numLayers));
                const layerProgress = (elapsed % (duration / this.numLayers)) / (duration / this.numLayers);
                
                // Create models with current state
                this.createAnimatedModels(foldingLayerIndex, layerProgress, stableStates);
                
                // Continue animation
                requestAnimationFrame(animate);
            } else {
                // Animation complete, show final state
                this.clearKreslingModels();
                this.createFoldedModels();
            }
        };
        
        // Start animation
        animate();
    }
    
    /**
     * Create models at a particular animation frame
     * @param {number} foldingLayerIndex - Index of the layer currently folding
     * @param {number} layerProgress - Progress of folding (0 to 1)
     * @param {Array} stableStates - Stable states for each layer
     */
    createAnimatedModels(foldingLayerIndex, layerProgress, stableStates) {
        // Materials
        const faceMaterials = [
            new THREE.MeshPhongMaterial({ 
                color: 0xe3f2fd, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8,
                flatShading: true
            }),
            new THREE.MeshPhongMaterial({ 
                color: 0xbbdefb, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8,
                flatShading: true
            }),
            new THREE.MeshPhongMaterial({ 
                color: 0x90caf9, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8,
                flatShading: true
            })
        ];
        
        const mountainMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 });
        const valleyMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
        const frameMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 3 });
        
        let zOffset = 0;
        
        // Create a model for each layer
        for (let i = 0; i < this.optimizedParameters.length; i++) {
            const params = this.optimizedParameters[i];
            
            // Create Kresling model
            const model = new KreslingModel({
                n: this.numCells,
                a: params.b2, // Top edge length is bottom edge length of next layer
                b: params.b1, // Bottom edge length
                c: params.c,  // Side edge length (mountain crease)
                beta: params.beta // Angle between bottom edge and mountain crease
            });
            
            // Determine the current height and twist angle
            let currentHeight, currentPhi;
            
            if (i < foldingLayerIndex) {
                // Layers that have completed folding
                currentHeight = stableStates[i].folded.h;
                currentPhi = stableStates[i].folded.phi;
            } else if (i > foldingLayerIndex) {
                // Layers that haven't started folding yet
                currentHeight = stableStates[i].deployed.h;
                currentPhi = stableStates[i].deployed.phi;
            } else {
                // The current folding layer - interpolate between states
                const easeProgress = 0.5 - 0.5 * Math.cos(layerProgress * Math.PI); // Ease in-out
                currentHeight = stableStates[i].deployed.h + easeProgress * (stableStates[i].folded.h - stableStates[i].deployed.h);
                currentPhi = stableStates[i].deployed.phi + easeProgress * (stableStates[i].folded.phi - stableStates[i].deployed.phi);
            }
            
            // Get vertex coordinates
            const { topVertices, bottomVertices } = model.getVertexCoordinates(currentHeight, currentPhi);
            
            // Create layer geometry
            const layerGeometry = new THREE.BufferGeometry();
            const vertices = [];
            
            // Shift vertices by zOffset
            const bottomVerticesShifted = bottomVertices.map(v => [v[0], v[1], v[2] + zOffset]);
            const topVerticesShifted = topVertices.map(v => [v[0], v[1], v[2] + zOffset]);
            
            // Create faces
            for (let j = 0; j < this.numCells; j++) {
                const nextJ = (j + 1) % this.numCells;
                
                // Bottom vertex, top vertex, next bottom vertex
                vertices.push(
                    ...bottomVerticesShifted[j],
                    ...topVerticesShifted[j],
                    ...bottomVerticesShifted[nextJ]
                );
                
                // Top vertex, next top vertex, next bottom vertex
                vertices.push(
                    ...topVerticesShifted[j],
                    ...topVerticesShifted[nextJ],
                    ...bottomVerticesShifted[nextJ]
                );
            }
            
            // Set vertices and compute normals
            layerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            layerGeometry.computeVertexNormals();
            
            // Create layer mesh
            const layerMesh = new THREE.Mesh(layerGeometry, faceMaterials[i % faceMaterials.length]);
            this.kreslingGroup.add(layerMesh);
            
            // Add mountain and valley creases
            for (let j = 0; j < this.numCells; j++) {
                const nextJ = (j + 1) % this.numCells;
                
                // Mountain crease (bottom to top)
                const mountainGeometry = new THREE.BufferGeometry();
                mountainGeometry.setFromPoints([
                    new THREE.Vector3(...bottomVerticesShifted[j]),
                    new THREE.Vector3(...topVerticesShifted[j])
                ]);
                const mountainLine = new THREE.Line(mountainGeometry, mountainMaterial);
                this.kreslingGroup.add(mountainLine);
                
                // Valley crease (bottom to next top)
                const valleyGeometry = new THREE.BufferGeometry();
                valleyGeometry.setFromPoints([
                    new THREE.Vector3(...bottomVerticesShifted[j]),
                    new THREE.Vector3(...topVerticesShifted[nextJ])
                ]);
                const valleyLine = new THREE.Line(valleyGeometry, valleyMaterial);
                this.kreslingGroup.add(valleyLine);
            }
            
            // Add top and bottom frames
            const topFrameGeometry = new THREE.BufferGeometry();
            const topFramePoints = topVerticesShifted.map(v => new THREE.Vector3(...v));
            topFrameGeometry.setFromPoints([...topFramePoints, topFramePoints[0]]);
            const topFrame = new THREE.Line(topFrameGeometry, frameMaterial);
            this.kreslingGroup.add(topFrame);
            
            const bottomFrameGeometry = new THREE.BufferGeometry();
            const bottomFramePoints = bottomVerticesShifted.map(v => new THREE.Vector3(...v));
            bottomFrameGeometry.setFromPoints([...bottomFramePoints, bottomFramePoints[0]]);
            const bottomFrame = new THREE.Line(bottomFrameGeometry, frameMaterial);
            this.kreslingGroup.add(bottomFrame);
            
            // Update zOffset for next layer
            zOffset += currentHeight;
        }
    }
    
    /**
     * Create models in the fully folded state
     */
    createFoldedModels() {
        // Materials
        const faceMaterials = [
            new THREE.MeshPhongMaterial({ 
                color: 0xe3f2fd, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8,
                flatShading: true
            }),
            new THREE.MeshPhongMaterial({ 
                color: 0xbbdefb, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8,
                flatShading: true
            }),
            new THREE.MeshPhongMaterial({ 
                color: 0x90caf9, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8,
                flatShading: true
            })
        ];
        
        const mountainMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 });
        const valleyMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
        const frameMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 3 });
        
        let zOffset = 0;
        
        // Create a model for each layer
        for (let i = 0; i < this.optimizedParameters.length; i++) {
            const params = this.optimizedParameters[i];
            
            // Create Kresling model
            const model = new KreslingModel({
                n: this.numCells,
                a: params.b2, // Top edge length is bottom edge length of next layer
                b: params.b1, // Bottom edge length
                c: params.c,  // Side edge length (mountain crease)
                beta: params.beta // Angle between bottom edge and mountain crease
            });
            
            // Get stable states
            const stableStates = model.findStableStates();
            const foldedHeight = params.h2;
            const foldedPhi = stableStates.state2?.phi || Math.PI / 2;
            
            // Get vertex coordinates
            const { topVertices, bottomVertices } = model.getVertexCoordinates(foldedHeight, foldedPhi);
            
            // Create layer geometry
            const layerGeometry = new THREE.BufferGeometry();
            const vertices = [];
            
            // Shift vertices by zOffset
            const bottomVerticesShifted = bottomVertices.map(v => [v[0], v[1], v[2] + zOffset]);
            const topVerticesShifted = topVertices.map(v => [v[0], v[1], v[2] + zOffset]);
            
            // Create faces
            for (let j = 0; j < this.numCells; j++) {
                const nextJ = (j + 1) % this.numCells;
                
                // Bottom vertex, top vertex, next bottom vertex
                vertices.push(
                    ...bottomVerticesShifted[j],
                    ...topVerticesShifted[j],
                    ...bottomVerticesShifted[nextJ]
                );
                
                // Top vertex, next top vertex, next bottom vertex
                vertices.push(
                    ...topVerticesShifted[j],
                    ...topVerticesShifted[nextJ],
                    ...bottomVerticesShifted[nextJ]
                );
            }
            
            // Set vertices and compute normals
            layerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            layerGeometry.computeVertexNormals();
            
            // Create layer mesh
            const layerMesh = new THREE.Mesh(layerGeometry, faceMaterials[i % faceMaterials.length]);
            this.kreslingGroup.add(layerMesh);
            
            // Add mountain and valley creases
            for (let j = 0; j < this.numCells; j++) {
                const nextJ = (j + 1) % this.numCells;
                
                // Mountain crease (bottom to top)
                const mountainGeometry = new THREE.BufferGeometry();
                mountainGeometry.setFromPoints([
                    new THREE.Vector3(...bottomVerticesShifted[j]),
                    new THREE.Vector3(...topVerticesShifted[j])
                ]);
                const mountainLine = new THREE.Line(mountainGeometry, mountainMaterial);
                this.kreslingGroup.add(mountainLine);
                
                // Valley crease (bottom to next top)
                const valleyGeometry = new THREE.BufferGeometry();
                valleyGeometry.setFromPoints([
                    new THREE.Vector3(...bottomVerticesShifted[j]),
                    new THREE.Vector3(...topVerticesShifted[nextJ])
                ]);
                const valleyLine = new THREE.Line(valleyGeometry, valleyMaterial);
                this.kreslingGroup.add(valleyLine);
            }
            
            // Add top and bottom frames
            const topFrameGeometry = new THREE.BufferGeometry();
            const topFramePoints = topVerticesShifted.map(v => new THREE.Vector3(...v));
            topFrameGeometry.setFromPoints([...topFramePoints, topFramePoints[0]]);
            const topFrame = new THREE.Line(topFrameGeometry, frameMaterial);
            this.kreslingGroup.add(topFrame);
            
            const bottomFrameGeometry = new THREE.BufferGeometry();
            const bottomFramePoints = bottomVerticesShifted.map(v => new THREE.Vector3(...v));
            bottomFrameGeometry.setFromPoints([...bottomFramePoints, bottomFramePoints[0]]);
            const bottomFrame = new THREE.Line(bottomFrameGeometry, frameMaterial);
            this.kreslingGroup.add(bottomFrame);
            
            // Update zOffset for next layer
            zOffset += foldedHeight;
        }
    }
    
    /**
     * Export the design parameters and patterns
     */
    exportDesign() {
        if (!this.optimizedParameters || this.optimizedParameters.length === 0) {
            alert('Please calculate design parameters first.');
            return;
        }
        
        // Create CSV content
        let csvContent = 'Layer,b1,b2,c,beta,h1,h2,Energy Barrier\n';
        
        this.optimizedParameters.forEach((params, index) => {
            csvContent += `${index + 1},${params.b1.toFixed(4)},${params.b2.toFixed(4)},`;
            csvContent += `${params.c.toFixed(4)},${params.beta.toFixed(4)},`;
            csvContent += `${params.h1.toFixed(4)},${params.h2.toFixed(4)},${params.energyBarrier.toFixed(4)}\n`;
        });
        
        // Create a blob from the CSV content
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `kresling_energy_design_${this.numLayers}x${this.numCells}.csv`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
}
