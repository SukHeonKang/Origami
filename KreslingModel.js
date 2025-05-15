/**
 * KreslingModel.js
 * 
 * A class representing the Conical Kresling Origami model
 * Based on the paper "Conical Kresling origami and its applications to curvature and energy programming"
 */
class KreslingModel {
    /**
     * Creates a new Kresling model
     * @param {Object} params - The geometric parameters
     * @param {number} params.n - Number of unit cells (default: 6)
     * @param {number} params.a - Top edge length (default: 1)
     * @param {number} params.b - Bottom edge length (default: 2)
     * @param {number} params.c - Side edge length (mountain crease) (default: 3)
     * @param {number} params.beta - Angle between bottom edge and mountain crease (default: 1.5)
     * @param {number} params.EA - Stiffness coefficient (default: 1)
     */
    constructor(params = {}) {
        // Basic parameters
        this.n = params.n || 6;                 // Number of unit cells
        this.a = params.a || 1;                 // Top edge length
        this.b = params.b || 2;                 // Bottom edge length
        this.c = params.c || 3;                 // Side edge length (mountain crease)
        this.beta = params.beta || 1.5;         // Angle between bottom edge and mountain crease
        
        // Calculate valley crease length
        this.d = Math.sqrt(this.b**2 + this.c**2 - 2 * this.b * this.c * Math.cos(this.beta));
        
        // Calculate radii of the circumcircles of top and bottom surfaces
        this.r = this.a / (2 * Math.sin(Math.PI / this.n));
        this.R = this.b / (2 * Math.sin(Math.PI / this.n));
        
        // Stiffness coefficients (simplified with EA = 1)
        this.EA = params.EA || 1;
        this.km = this.EA / this.c;
        this.kv = this.EA / this.d;
        
        // Cache for stable states
        this._stableStates = null;
    }
    
    /**
     * Calculate crease lengths at a folded state
     * @param {number} h - Height
     * @param {number} phi - Twist angle
     * @returns {Object} Crease lengths
     */
    computeCreaseLength(h, phi) {
        const cTilde = Math.sqrt(h**2 + this.r**2 + this.R**2 - 2 * this.r * this.R * Math.cos(phi));
        const dTilde = Math.sqrt(h**2 + this.r**2 + this.R**2 - 2 * this.r * this.R * Math.cos(phi + 2 * Math.PI / this.n));
        return { cTilde, dTilde };
    }
    
    /**
     * Calculate elastic energy at a folded state
     * @param {number} h - Height
     * @param {number} phi - Twist angle
     * @returns {number} Elastic energy
     */
    computeEnergy(h, phi) {
        const { cTilde, dTilde } = this.computeCreaseLength(h, phi);
        const energy = this.n * this.km * (cTilde - this.c)**2 / 2 + 
                       this.n * this.kv * (dTilde - this.d)**2 / 2;
        return energy;
    }
    
    /**
     * Calculate the energy landscape for a range of heights
     * @param {number} hMin - Minimum height
     * @param {number} hMax - Maximum height
     * @param {number} steps - Number of steps
     * @returns {Array} Array of [height, energy] pairs
     */
    computeEnergyLandscape(hMin = 0, hMax = 4, steps = 100) {
        const result = [];
        const hStep = (hMax - hMin) / steps;
        
        for (let i = 0; i <= steps; i++) {
            const h = hMin + i * hStep;
            // For each height, find the twist angle that minimizes energy
            const phi = this.findEquilibriumTwistAngle(h);
            const energy = this.computeEnergy(h, phi);
            result.push([h, energy]);
        }
        
        return result;
    }
    
    /**
     * Find the twist angle that minimizes energy for a given height
     * @param {number} h - Height
     * @returns {number} Equilibrium twist angle
     */
    findEquilibriumTwistAngle(h) {
        // Equation derived from ∂U/∂ϕ = 0
        // This is a simplified version - for precise results, numerical optimization should be used
        
        // Range of possible twist angles
        const phiMin = 0;
        const phiMax = Math.min(Math.PI, Math.PI - 2 * Math.PI / this.n);
        const steps = 100;
        const phiStep = (phiMax - phiMin) / steps;
        
        let minEnergy = Infinity;
        let minPhi = 0;
        
        for (let i = 0; i <= steps; i++) {
            const phi = phiMin + i * phiStep;
            const energy = this.computeEnergy(h, phi);
            
            if (energy < minEnergy) {
                minEnergy = energy;
                minPhi = phi;
            }
        }
        
        return minPhi;
    }
    
    /**
     * Find stable states of the Kresling model
     * @returns {Object} Stable states
     */
    findStableStates() {
        if (this._stableStates) {
            return this._stableStates;
        }
        
        // Calculate lambda parameter
        const lambda = ((this.b - 2 * this.c * Math.cos(this.beta)) / this.a) * Math.sin(Math.PI / this.n);
        
        // First stable state (h1, phi1)
        let phi1, h1, state1 = null;
        
        if (Math.abs(lambda) <= 1) {
            phi1 = Math.asin(lambda) - Math.PI / this.n;
            h1 = Math.sqrt(Math.max(0, this.c**2 - this.r**2 - this.R**2 + 2 * this.r * this.R * Math.cos(phi1)));
            state1 = { h: h1, phi: phi1 };
        }
        
        // Second stable state (h2, phi2)
        let phi2, h2, state2 = null;
        
        if (Math.abs(lambda) <= 1) {
            phi2 = Math.PI - Math.asin(lambda) - Math.PI / this.n;
            h2 = Math.sqrt(Math.max(0, this.c**2 - this.r**2 - this.R**2 + 2 * this.r * this.R * Math.cos(phi2)));
            state2 = { h: h2, phi: phi2 };
        }
        
        this._stableStates = { state1, state2 };
        return this._stableStates;
    }
    
    /**
     * Calculate the energy barrier between stable states
     * @returns {number} Energy barrier
     */
    computeEnergyBarrier() {
        // Find saddle point (h0, phi0)
        const phi0 = Math.PI / 2 - Math.PI / this.n;
        const h0 = this.computeH0ForPhi0(phi0);
        
        // Calculate energy at saddle point
        const maxEnergy = this.computeEnergy(h0, phi0);
        
        // Energy at stable states should be zero for a perfect bistable system
        return maxEnergy;
    }
    
    /**
     * Calculate h0 for phi0
     * @param {number} phi0 - Twist angle
     * @returns {number} Corresponding height
     */
    computeH0ForPhi0(phi0) {
        // This is an approximation based on equation (2.9) from the paper
        // A more accurate result would require solving the equation numerically
        
        // Estimate h0 based on geometry
        const h0Estimate = Math.sqrt(Math.max(0, this.c**2 - this.r**2 - this.R**2 + 
                           2 * this.r * this.R * Math.sin(Math.PI / this.n)));
        
        return h0Estimate;
    }
    
    /**
     * Check if Kresling origami is bistable
     * @returns {boolean} True if bistable
     */
    isBistable() {
        const { state1, state2 } = this.findStableStates();
        return state1 !== null && state2 !== null;
    }
    
    /**
     * Calculate the phase of Kresling based on geometric parameters
     * @returns {string} Phase (monostable, bistable-zero-energy, bistable-nonzero-energy)
     */
    calculatePhase() {
        const { state1, state2 } = this.findStableStates();
        
        if (!state1 || !state2) {
            return "monostable";
        }
        
        // Calculate lambda parameter
        const lambda = ((this.b - 2 * this.c * Math.cos(this.beta)) / this.a) * Math.sin(Math.PI / this.n);
        
        if (Math.abs(lambda) > 1) {
            return "monostable";
        }
        
        // Check phi0 and phif relation
        const phi0 = Math.PI / 2 - Math.PI / this.n;
        // phif is the twist angle at the folded-flat state
        // This is a simplified check based on the paper's phase diagrams
        const cfs = Math.sqrt(this.r**2 + this.R**2 + 2 * this.r * this.R * Math.cos(2 * Math.PI / this.n));
        
        if (this.c > cfs) {
            return "bistable-zero-energy";
        } else if (state1.phi <= phi0 && phi0 <= state2.phi) {
            return "bistable-zero-energy";
        } else {
            return "bistable-nonzero-energy";
        }
    }
    
    /**
     * Get 3D coordinates of Kresling vertices
     * @param {number} h - Height
     * @param {number} phi - Twist angle
     * @returns {Object} Coordinates of top and bottom vertices
     */
    getVertexCoordinates(h, phi) {
        const topVertices = [];
        const bottomVertices = [];
        const midPoint = [0, 0, h/2];
        
        // Calculate vertices
        for (let i = 0; i < this.n; i++) {
            // Bottom vertices
            const bottomAngle = i * 2 * Math.PI / this.n;
            const bottomX = this.R * Math.cos(bottomAngle);
            const bottomY = this.R * Math.sin(bottomAngle);
            const bottomZ = -h/2;
            bottomVertices.push([bottomX, bottomY, bottomZ]);
            
            // Top vertices (with twist)
            const topAngle = i * 2 * Math.PI / this.n + phi;
            const topX = this.r * Math.cos(topAngle);
            const topY = this.r * Math.sin(topAngle);
            const topZ = h/2;
            topVertices.push([topX, topY, topZ]);
        }
        
        return { topVertices, bottomVertices, midPoint };
    }
    
    /**
     * Export Kresling pattern to SVG format
     * @returns {string} SVG string
     */
    exportSVGPattern() {
        // Create a 2D crease pattern for fabrication
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="-400 -300 800 600">
            <style>
                .mountain { stroke: #0000FF; stroke-width: 2; stroke-dasharray: 5,3; }
                .valley { stroke: #FF0000; stroke-width: 2; stroke-dasharray: 5,3; }
                .outline { stroke: #000000; stroke-width: 3; fill: none; }
                .text { font-family: Arial; font-size: 12px; }
            </style>
            <!-- Pattern will be generated here -->
        </svg>`;
        
        // Note: Full implementation would create a complete crease pattern
        // This is a placeholder for the complete SVG generation function
        
        return svg;
    }
}