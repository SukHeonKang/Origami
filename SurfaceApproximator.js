/**
 * SurfaceApproximator.js
 * 
 * A class to handle surface approximation using Conical Kresling Origami
 */
class SurfaceApproximator {
    /**
     * Creates a new surface approximator
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
        
        this.targetSurface = 'hyperboloid';
        this.targetEquation = '';
        this.numLayers = 6;
        this.numCells = 10;
        
        this.targetMesh = null;
        this.kreslingMesh = null;
        
        this.showTarget = true;
        
        this.layerParameters = [];
        
        this.targetMaterial = new THREE.MeshPhongMaterial({
            color: 0x3f51b5,
            opacity: 0.3,
            transparent: true,
            side: THREE.DoubleSide,
            wireframe: false
        });
        
        this.kreslingMaterial = new THREE.MeshPhongMaterial({
            color: 0x4caf50,
            opacity: 0.7,
            transparent: true,
            side: THREE.DoubleSide,
            wireframe: false
        });
        
        this.init();
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
        this.camera.position.set(15, 15, 15);
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
        
        // Initial rendering
        this.createTargetSurface();
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    /**
     * Bind event handlers
     */
    bindEvents() {
        // Target surface selection
        document.getElementById('surface-select').addEventListener('change', (e) => {
            this.targetSurface = e.target.value;
            
            // Show/hide custom equation input
            const customEquationContainer = document.getElementById('custom-equation-container');
            if (this.targetSurface === 'custom') {
                customEquationContainer.style.display = 'block';
            } else {
                customEquationContainer.style.display = 'none';
            }
            
            this.createTargetSurface();
        });
        
        // Custom equation input
        document.getElementById('custom-equation').addEventListener('input', (e) => {
            this.targetEquation = e.target.value;
            if (this.targetSurface === 'custom' && this.targetEquation.trim() !== '') {
                this.createTargetSurface();
            }
        });
        
        // Number of layers slider
        document.getElementById('layers-slider').addEventListener('input', (e) => {
            this.numLayers = parseInt(e.target.value);
            document.getElementById('layers-value').textContent = this.numLayers;
        });
        
        // Number of cells slider
        document.getElementById('cells-slider').addEventListener('input', (e) => {
            this.numCells = parseInt(e.target.value);
            document.getElementById('cells-value').textContent = this.numCells;
        });
        
        // Calculate approximation button
        document.getElementById('calculate-surface-btn').addEventListener('click', () => {
            this.calculateApproximation();
        });
        
        // Toggle model/target button
        document.getElementById('toggle-model-btn').addEventListener('click', () => {
            this.toggleModelTarget();
        });
        
        // Export pattern button
        document.getElementById('export-pattern-btn').addEventListener('click', () => {
            this.exportPattern();
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
     * Create the target surface
     */
    createTargetSurface() {
        // Remove existing target surface
        if (this.targetMesh) {
            this.scene.remove(this.targetMesh);
            this.targetMesh.geometry.dispose();
            this.targetMesh.material.dispose();
            this.targetMesh = null;
        }
        
        let geometryFunc;
        
        // Define surface based on selection
        switch (this.targetSurface) {
            case 'hyperboloid':
                geometryFunc = (u, v) => {
                    // (x^2 + y^2)/9 - 3z^2/25 = 1
                    const r = 3 * Math.sqrt(1 + 3 * v * v / 25);
                    const x = r * Math.cos(u * 2 * Math.PI);
                    const y = r * Math.sin(u * 2 * Math.PI);
                    const z = 5 * v;
                    return new THREE.Vector3(x, y, z);
                };
                break;
                
            case 'ellipsoid':
                geometryFunc = (u, v) => {
                    // (x^2 + y^2)/36 + 3z^2/100 = 1
                    const theta = u * 2 * Math.PI;
                    const phi = v * Math.PI - Math.PI / 2;
                    const x = 6 * Math.cos(phi) * Math.cos(theta);
                    const y = 6 * Math.cos(phi) * Math.sin(theta);
                    const z = 5.77 * Math.sin(phi);
                    return new THREE.Vector3(x, y, z);
                };
                break;
                
            case 'sinusoid':
                geometryFunc = (u, v) => {
                    // r = 2*sin(-0.6z) + 4
                    const theta = u * 2 * Math.PI;
                    const z = 10 * v - 5;
                    const r = 2 * Math.sin(-0.6 * z) + 4;
                    const x = r * Math.cos(theta);
                    const y = r * Math.sin(theta);
                    return new THREE.Vector3(x, y, z);
                };
                break;
                
            case 'cone':
                geometryFunc = (u, v) => {
                    // 2sqrt(x^2 + y^2) + z = 18
                    const theta = u * 2 * Math.PI;
                    const z = 12 * v;
                    const r = (18 - z) / 2;
                    const x = r * Math.cos(theta);
                    const y = r * Math.sin(theta);
                    return new THREE.Vector3(x, y, z);
                };
                break;
                
            case 'custom':
                // Parse custom equation - this is a simplified version
                // In a real implementation, you would need a more robust equation parser
                try {
                    // Example: (x^2 + y^2)/9 - 3*z^2/25 = 1
                    geometryFunc = (u, v) => {
                        const theta = u * 2 * Math.PI;
                        const z = 10 * v - 5;
                        
                        // Simple interpretation - requires specific format
                        // This is a placeholder for a real equation parser
                        const r = 3 + v * 2; // Default fallback
                        
                        const x = r * Math.cos(theta);
                        const y = r * Math.sin(theta);
                        return new THREE.Vector3(x, y, z);
                    };
                } catch (error) {
                    console.error("Error parsing custom equation:", error);
                    return;
                }
                break;
        }
        
        // Create parametric geometry
        const geometry = new THREE.ParametricBufferGeometry(geometryFunc, 50, 50);
        
        // Create mesh
        this.targetMesh = new THREE.Mesh(geometry, this.targetMaterial);
        this.scene.add(this.targetMesh);
    }
    
    /**
     * Calculate the Kresling origami approximation of the target surface
     */
    calculateApproximation() {
        // Remove existing Kresling mesh
        if (this.kreslingMesh) {
            this.scene.remove(this.kreslingMesh);
            
            if (this.kreslingMesh.geometry) {
                this.kreslingMesh.geometry.dispose();
            }
            
            if (Array.isArray(this.kreslingMesh.material)) {
                this.kreslingMesh.material.forEach(mat => mat.dispose());
            } else {
                this.kreslingMesh.material.dispose();
            }
            
            this.kreslingMesh = null;
        }
        
        // Calculate layer parameters based on target surface
        this.calculateLayerParameters();
        
        // Create Kresling mesh
        this.createKreslingMesh();
        
        // Update parameters table
        this.updateParametersTable();
        
        // Show approximation info
        this.updateApproximationInfo();
    }
    
    /**
     * Calculate layer parameters for the Kresling origami approximation
     */
    calculateLayerParameters() {
        // This is a placeholder for the actual layer parameters calculation
        // In a real implementation, this would use the inverse design method from the paper
        
        this.layerParameters = [];
        
        const zMin = -5;
        const zMax = 5;
        const zStep = (zMax - zMin) / this.numLayers;
        
        // Example parameter calculation for hyperboloid
        for (let i = 0; i < this.numLayers; i++) {
            const z = zMin + i * zStep;
            const zNext = zMin + (i + 1) * zStep;
            
            let r, rNext;
            
            switch (this.targetSurface) {
                case 'hyperboloid':
                    r = 3 * Math.sqrt(1 + 3 * (z / 5) ** 2);
                    rNext = 3 * Math.sqrt(1 + 3 * (zNext / 5) ** 2);
                    break;
                    
                case 'ellipsoid':
                    const phi = ((z + 5) / 10) * Math.PI - Math.PI / 2;
                    const phiNext = ((zNext + 5) / 10) * Math.PI - Math.PI / 2;
                    r = 6 * Math.cos(phi);
                    rNext = 6 * Math.cos(phiNext);
                    break;
                    
                case 'sinusoid':
                    r = 2 * Math.sin(-0.6 * z) + 4;
                    rNext = 2 * Math.sin(-0.6 * zNext) + 4;
                    break;
                    
                case 'cone':
                    r = (18 - z) / 2;
                    rNext = (18 - zNext) / 2;
                    break;
                    
                case 'custom':
                    // Simple fallback for custom equation
                    r = 3 + (z + 5) / 5;
                    rNext = 3 + (zNext + 5) / 5;
                    break;
            }
            
            // Calculate geometric parameters for the layer
            // This is a simplified calculation - real implementation would use the equations from the paper
            const a = 2 * r * Math.sin(Math.PI / this.numCells);
            const b = 2 * rNext * Math.sin(Math.PI / this.numCells);
            const c = Math.sqrt((zStep) ** 2 + (r - rNext) ** 2 + 4 * r * rNext * Math.sin(Math.PI / this.numCells) ** 2);
            const beta = Math.PI - Math.acos((b ** 2 + c ** 2 - (zStep) ** 2 - (r - rNext) ** 2 - 4 * r * rNext * Math.sin(Math.PI / this.numCells) ** 2) / (2 * b * c));
            
            // Calculate stable states (simplification)
            const h1 = zStep;
            const phi1 = Math.asin(((b - 2 * c * Math.cos(beta)) / a) * Math.sin(Math.PI / this.numCells)) - Math.PI / this.numCells;
            const h2 = 0.2 * zStep; // For illustration - this would be calculated based on equations
            const phi2 = Math.PI - Math.asin(((b - 2 * c * Math.cos(beta)) / a) * Math.sin(Math.PI / this.numCells)) - Math.PI / this.numCells;
            
            this.layerParameters.push({
                layer: i + 1,
                a: a,
                b: b,
                c: c,
                beta: beta,
                h1: h1,
                phi1: phi1,
                h2: h2,
                phi2: phi2
            });
        }
    }
    
    /**
     * Create the Kresling mesh based on calculated layer parameters
     */
    createKreslingMesh() {
        // Group for all Kresling components
        const kreslingGroup = new THREE.Group();
        
        let zOffset = -5; // Start at zMin
        
        // Create each layer
        for (let i = 0; i < this.layerParameters.length; i++) {
            const params = this.layerParameters[i];
            
            // Create Kresling model for the layer
            const model = new KreslingModel({
                n: this.numCells,
                a: params.a,
                b: params.b,
                c: params.c,
                beta: params.beta
            });
            
            // Get vertex coordinates for the deployed state
            const { topVertices, bottomVertices } = model.getVertexCoordinates(params.h1, params.phi1);
            
            // Create layer geometry
            const layerGeometry = new THREE.BufferGeometry();
            const vertices = [];
            const faces = [];
            const colors = [];
            
            // Add bottom vertices (shifted by zOffset)
            const bottomVerticesShifted = bottomVertices.map(v => [v[0], v[1], v[2] + zOffset]);
            
            // Add top vertices (shifted by zOffset)
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
                
                // Add colors (alternating)
                const color1 = j % 2 === 0 ? new THREE.Color(0xe3f2fd) : new THREE.Color(0xbbdefb);
                const color2 = j % 2 === 0 ? new THREE.Color(0xbbdefb) : new THREE.Color(0xe3f2fd);
                
                colors.push(
                    ...color1.toArray(), ...color1.toArray(), ...color1.toArray(),
                    ...color2.toArray(), ...color2.toArray(), ...color2.toArray()
                );
            }
            
            // Set vertices and faces
            layerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            layerGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            layerGeometry.computeVertexNormals();
            
            // Create layer mesh
            const layerMaterial = new THREE.MeshPhongMaterial({
                vertexColors: true,
                side: THREE.DoubleSide,
                flatShading: true,
                transparent: true,
                opacity: 0.8
            });
            
            const layerMesh = new THREE.Mesh(layerGeometry, layerMaterial);
            kreslingGroup.add(layerMesh);
            
            // Add mountain and valley creases
            const mountainMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 });
            const valleyMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
            
            for (let j = 0; j < this.numCells; j++) {
                const nextJ = (j + 1) % this.numCells;
                
                // Mountain crease (bottom to top)
                const mountainGeometry = new THREE.BufferGeometry();
                mountainGeometry.setFromPoints([
                    new THREE.Vector3(...bottomVerticesShifted[j]),
                    new THREE.Vector3(...topVerticesShifted[j])
                ]);
                const mountainLine = new THREE.Line(mountainGeometry, mountainMaterial);
                kreslingGroup.add(mountainLine);
                
                // Valley crease (bottom to next top)
                const valleyGeometry = new THREE.BufferGeometry();
                valleyGeometry.setFromPoints([
                    new THREE.Vector3(...bottomVerticesShifted[j]),
                    new THREE.Vector3(...topVerticesShifted[nextJ])
                ]);
                const valleyLine = new THREE.Line(valleyGeometry, valleyMaterial);
                kreslingGroup.add(valleyLine);
            }
            
            // Add top and bottom frames
            const frameMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 3 });
            
            const topFrameGeometry = new THREE.BufferGeometry();
            const topFramePoints = topVerticesShifted.map(v => new THREE.Vector3(...v));
            topFrameGeometry.setFromPoints([...topFramePoints, topFramePoints[0]]);
            const topFrame = new THREE.Line(topFrameGeometry, frameMaterial);
            kreslingGroup.add(topFrame);
            
            const bottomFrameGeometry = new THREE.BufferGeometry();
            const bottomFramePoints = bottomVerticesShifted.map(v => new THREE.Vector3(...v));
            bottomFrameGeometry.setFromPoints([...bottomFramePoints, bottomFramePoints[0]]);
            const bottomFrame = new THREE.Line(bottomFrameGeometry, frameMaterial);
            kreslingGroup.add(bottomFrame);
            
            // Update zOffset for next layer
            zOffset += params.h1;
        }
        
        // Add to scene
        this.kreslingMesh = kreslingGroup;
        this.scene.add(this.kreslingMesh);
    }
    
    /**
     * Update the parameters table with calculated layer parameters
     */
    updateParametersTable() {
        const tableBody = document.getElementById('layer-parameters-body');
        tableBody.innerHTML = '';
        
        this.layerParameters.forEach(params => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${params.layer}</td>
                <td>${params.a.toFixed(4)}</td>
                <td>${params.b.toFixed(4)}</td>
                <td>${params.c.toFixed(4)}</td>
                <td>${params.beta.toFixed(4)}</td>
                <td>${params.h1.toFixed(4)}</td>
                <td>${params.h2.toFixed(4)}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    /**
     * Update approximation information
     */
    updateApproximationInfo() {
        const infoElement = document.getElementById('approximation-info');
        
        infoElement.innerHTML = `
            <h3>Approximation Results</h3>
            <p><strong>Target Surface:</strong> ${this.targetSurface.charAt(0).toUpperCase() + this.targetSurface.slice(1)}</p>
            <p><strong>Number of Layers:</strong> ${this.numLayers}</p>
            <p><strong>Cells per Layer:</strong> ${this.numCells}</p>
            <p><strong>Status:</strong> Approximation calculation completed</p>
        `;
    }
    
    /**
     * Toggle between showing target surface and Kresling model
     */
    toggleModelTarget() {
        if (this.targetMesh && this.kreslingMesh) {
            this.showTarget = !this.showTarget;
            
            if (this.showTarget) {
                this.targetMesh.visible = true;
                this.kreslingMesh.visible = false;
            } else {
                this.targetMesh.visible = false;
                this.kreslingMesh.visible = true;
            }
        }
    }
    
    /**
     * Export the Kresling pattern as SVG
     */
    exportPattern() {
        if (!this.layerParameters || this.layerParameters.length === 0) {
            alert('Please calculate an approximation first.');
            return;
        }
        
        // Generate SVG pattern
        let svgContent = `
            <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="-400 -300 800 600">
                <style>
                    .mountain { stroke: #0000FF; stroke-width: 2; stroke-dasharray: 5,3; }
                    .valley { stroke: #FF0000; stroke-width: 2; stroke-dasharray: 5,3; }
                    .outline { stroke: #000000; stroke-width: 3; fill: none; }
                    .text { font-family: Arial; font-size: 12px; }
                </style>
                <!-- Pattern content will be generated here -->
            </svg>
        `;
        
        // Create a blob from the SVG content
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `kresling_pattern_${this.targetSurface}_${this.numLayers}x${this.numCells}.svg`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
}