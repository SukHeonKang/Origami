/**
 * KreslingVisualizer.js
 * 
 * A class to visualize the Conical Kresling Origami model using Three.js
 */
class KreslingVisualizer {
    /**
     * Creates a new Kresling visualizer
     * @param {string} containerId - ID of the container element
     * @param {KreslingModel} model - The Kresling model to visualize
     */
    constructor(containerId, model) {
        this.containerId = containerId;
        this.model = model;
        this.container = document.getElementById(containerId);
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.kreslingGroup = null;
        
        this.currentHeight = 2.0;
        this.currentState = 'deployed'; // 'deployed', 'folded', or 'custom'
        
        this.mountainMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 });
        this.valleyMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
        this.frameMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 3 });
        
        this.faceMaterial1 = new THREE.MeshPhongMaterial({ 
            color: 0xe3f2fd, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
            flatShading: true
        });
        
        this.faceMaterial2 = new THREE.MeshPhongMaterial({ 
            color: 0xbbdefb, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
            flatShading: true
        });
        
        this.init();
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
        this.container.appendChild(this.renderer.domElement);
        
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
        
        // Create group for Kresling model
        this.kreslingGroup = new THREE.Group();
        this.scene.add(this.kreslingGroup);
        
        // Initial rendering
        this.updateModel();
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    /**
     * Handle window resize
     */
    onWindowResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        
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
     * Update the model visualization
     */
    updateModel() {
        // Clear previous model
        while (this.kreslingGroup.children.length > 0) {
            const child = this.kreslingGroup.children[0];
            this.kreslingGroup.remove(child);
            
            if (child.geometry) {
                child.geometry.dispose();
            }
            
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
        
        // Get height and twist angle based on current state
        let height, phi;
        
        if (this.currentState === 'deployed') {
            const stableStates = this.model.findStableStates();
            if (stableStates.state1) {
                height = stableStates.state1.h;
                phi = stableStates.state1.phi;
            } else {
                height = this.currentHeight;
                phi = this.model.findEquilibriumTwistAngle(height);
            }
        } else if (this.currentState === 'folded') {
            const stableStates = this.model.findStableStates();
            if (stableStates.state2) {
                height = stableStates.state2.h;
                phi = stableStates.state2.phi;
            } else {
                height = 0.5;
                phi = Math.PI / 4;
            }
        } else {
            // Custom state
            height = this.currentHeight;
            phi = this.model.findEquilibriumTwistAngle(height);
        }
        
        // Get vertex coordinates
        const { topVertices, bottomVertices } = this.model.getVertexCoordinates(height, phi);
        const n = this.model.n;
        
        // Create geometry
        const scale = 1.5; // Adjust scale for better visualization
        
        // Create surfaces
        for (let i = 0; i < n; i++) {
            const nextI = (i + 1) % n;
            
            // Scale vertices
            const v1 = new THREE.Vector3(...bottomVertices[i].map(x => x * scale));
            const v2 = new THREE.Vector3(...topVertices[i].map(x => x * scale));
            const v3 = new THREE.Vector3(...bottomVertices[nextI].map(x => x * scale));
            const v4 = new THREE.Vector3(...topVertices[nextI].map(x => x * scale));
            
            // First triangle (bottom-top-bottom)
            const geometry1 = new THREE.BufferGeometry();
            geometry1.setFromPoints([v1, v2, v3]);
            geometry1.computeVertexNormals();
            
            const mesh1 = new THREE.Mesh(geometry1, i % 2 === 0 ? this.faceMaterial1 : this.faceMaterial2);
            this.kreslingGroup.add(mesh1);
            
            // Second triangle (top-top-bottom)
            const geometry2 = new THREE.BufferGeometry();
            geometry2.setFromPoints([v2, v4, v3]);
            geometry2.computeVertexNormals();
            
            const mesh2 = new THREE.Mesh(geometry2, i % 2 === 0 ? this.faceMaterial2 : this.faceMaterial1);
            this.kreslingGroup.add(mesh2);
            
            // Mountain crease (bottom-top)
            const mountainGeometry = new THREE.BufferGeometry();
            mountainGeometry.setFromPoints([v1, v2]);
            
            const mountainLine = new THREE.Line(mountainGeometry, this.mountainMaterial);
            this.kreslingGroup.add(mountainLine);
            
            // Valley crease (bottom-next top)
            const valleyGeometry = new THREE.BufferGeometry();
            valleyGeometry.setFromPoints([v1, v4]);
            
            const valleyLine = new THREE.Line(valleyGeometry, this.valleyMaterial);
            this.kreslingGroup.add(valleyLine);
        }
        
        // Create top and bottom frames
        const topFrameGeometry = new THREE.BufferGeometry();
        const topFramePoints = topVertices.map(v => new THREE.Vector3(...v.map(x => x * scale)));
        topFrameGeometry.setFromPoints([...topFramePoints, topFramePoints[0]]);
        
        const topFrame = new THREE.Line(topFrameGeometry, this.frameMaterial);
        this.kreslingGroup.add(topFrame);
        
        const bottomFrameGeometry = new THREE.BufferGeometry();
        const bottomFramePoints = bottomVertices.map(v => new THREE.Vector3(...v.map(x => x * scale)));
        bottomFrameGeometry.setFromPoints([...bottomFramePoints, bottomFramePoints[0]]);
        
        const bottomFrame = new THREE.Line(bottomFrameGeometry, this.frameMaterial);
        this.kreslingGroup.add(bottomFrame);
    }
    
    /**
     * Update the visualizer with new model parameters
     * @param {KreslingModel} model - New Kresling model
     */
    setModel(model) {
        this.model = model;
        this.updateModel();
    }
    
    /**
     * Update the height of the model
     * @param {number} height - New height
     */
    setHeight(height) {
        this.currentHeight = height;
        this.currentState = 'custom';
        this.updateModel();
    }
    
    /**
     * Set the current state of the model
     * @param {string} state - 'deployed', 'folded', or 'custom'
     */
    setState(state) {
        this.currentState = state;
        this.updateModel();
    }
    
    /**
     * Toggle between deployed and folded states
     */
    toggleState() {
        if (this.currentState === 'deployed') {
            this.setState('folded');
        } else {
            this.setState('deployed');
        }
    }
    
    /**
     * Animate the transition between states
     * @param {string} targetState - Target state ('deployed' or 'folded')
     * @param {number} duration - Animation duration in milliseconds
     */
    animateToState(targetState, duration = 1000) {
        // Get start and end heights and twist angles
        let startHeight, startPhi, endHeight, endPhi;
        
        const stableStates = this.model.findStableStates();
        
        if (this.currentState === 'deployed' || this.currentState === 'custom') {
            startHeight = this.currentHeight;
            startPhi = this.model.findEquilibriumTwistAngle(startHeight);
        } else if (this.currentState === 'folded') {
            if (stableStates.state2) {
                startHeight = stableStates.state2.h;
                startPhi = stableStates.state2.phi;
            } else {
                startHeight = 0.5;
                startPhi = Math.PI / 4;
            }
        }
        
        if (targetState === 'deployed') {
            if (stableStates.state1) {
                endHeight = stableStates.state1.h;
                endPhi = stableStates.state1.phi;
            } else {
                endHeight = 2.0;
                endPhi = 0;
            }
        } else if (targetState === 'folded') {
            if (stableStates.state2) {
                endHeight = stableStates.state2.h;
                endPhi = stableStates.state2.phi;
            } else {
                endHeight = 0.5;
                endPhi = Math.PI / 4;
            }
        }
        
        // Animation variables
        const startTime = Date.now();
        const endTime = startTime + duration;
        
        // Animation function
        const animate = () => {
            const currentTime = Date.now();
            
            if (currentTime <= endTime) {
                // Calculate interpolation factor (0 to 1)
                const t = (currentTime - startTime) / duration;
                
                // Ease in-out interpolation
                const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                
                // Interpolate height and phi
                const height = startHeight + easeT * (endHeight - startHeight);
                const phi = startPhi + easeT * (endPhi - startPhi);
                
                // Set as custom state to use provided height and phi
                this.currentState = 'custom';
                this.currentHeight = height;
                
                // Get vertex coordinates and update model
                const { topVertices, bottomVertices } = this.model.getVertexCoordinates(height, phi);
                this.updateVisualizationWithCoordinates(topVertices, bottomVertices);
                
                // Continue animation
                requestAnimationFrame(animate);
            } else {
                // Animation complete
                this.currentState = targetState;
                this.updateModel();
            }
        };
        
        // Start animation
        animate();
    }
    
    /**
     * Update the visualization with given coordinates
     * @param {Array} topVertices - Array of top vertex coordinates
     * @param {Array} bottomVertices - Array of bottom vertex coordinates
     */
    updateVisualizationWithCoordinates(topVertices, bottomVertices) {
        // Clear previous model
        while (this.kreslingGroup.children.length > 0) {
            const child = this.kreslingGroup.children[0];
            this.kreslingGroup.remove(child);
            
            if (child.geometry) {
                child.geometry.dispose();
            }
            
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
        
        const n = this.model.n;
        const scale = 1.5;
        
        // Create surfaces
        for (let i = 0; i < n; i++) {
            const nextI = (i + 1) % n;
            
            // Scale vertices
            const v1 = new THREE.Vector3(...bottomVertices[i].map(x => x * scale));
            const v2 = new THREE.Vector3(...topVertices[i].map(x => x * scale));
            const v3 = new THREE.Vector3(...bottomVertices[nextI].map(x => x * scale));
            const v4 = new THREE.Vector3(...topVertices[nextI].map(x => x * scale));
            
            // First triangle (bottom-top-bottom)
            const geometry1 = new THREE.BufferGeometry();
            geometry1.setFromPoints([v1, v2, v3]);
            geometry1.computeVertexNormals();
            
            const mesh1 = new THREE.Mesh(geometry1, i % 2 === 0 ? this.faceMaterial1 : this.faceMaterial2);
            this.kreslingGroup.add(mesh1);
            
            // Second triangle (top-top-bottom)
            const geometry2 = new THREE.BufferGeometry();
            geometry2.setFromPoints([v2, v4, v3]);
            geometry2.computeVertexNormals();
            
            const mesh2 = new THREE.Mesh(geometry2, i % 2 === 0 ? this.faceMaterial2 : this.faceMaterial1);
            this.kreslingGroup.add(mesh2);
            
            // Mountain crease (bottom-top)
            const mountainGeometry = new THREE.BufferGeometry();
            mountainGeometry.setFromPoints([v1, v2]);
            
            const mountainLine = new THREE.Line(mountainGeometry, this.mountainMaterial);
            this.kreslingGroup.add(mountainLine);
            
            // Valley crease (bottom-next top)
            const valleyGeometry = new THREE.BufferGeometry();
            valleyGeometry.setFromPoints([v1, v4]);
            
            const valleyLine = new THREE.Line(valleyGeometry, this.valleyMaterial);
            this.kreslingGroup.add(valleyLine);
        }
        
        // Create top and bottom frames
        const topFrameGeometry = new THREE.BufferGeometry();
        const topFramePoints = topVertices.map(v => new THREE.Vector3(...v.map(x => x * scale)));
        topFrameGeometry.setFromPoints([...topFramePoints, topFramePoints[0]]);
        
        const topFrame = new THREE.Line(topFrameGeometry, this.frameMaterial);
        this.kreslingGroup.add(topFrame);
        
        const bottomFrameGeometry = new THREE.BufferGeometry();
        const bottomFramePoints = bottomVertices.map(v => new THREE.Vector3(...v.map(x => x * scale)));
        bottomFrameGeometry.setFromPoints([...bottomFramePoints, bottomFramePoints[0]]);
        
        const bottomFrame = new THREE.Line(bottomFrameGeometry, this.frameMaterial);
        this.kreslingGroup.add(bottomFrame);
    }
    
    /**
     * Get Kresling visualizer element
     * @returns {HTMLElement} Canvas element
     */
    getElement() {
        return this.renderer.domElement;
    }
}