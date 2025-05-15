/**
 * KreslingController.js
 * 
 * Controller for the Kresling origami simulator
 * Handles user interaction and updates the model and visualization
 */
class KreslingController {
    /**
     * Creates a new controller for the Kresling simulator
     */
    constructor() {
        // Initialize model with default parameters
        this.model = new KreslingModel();
        
        // Initialize visualizer
        this.visualizer = new KreslingVisualizer('visualization-container', this.model);
        
        // Initialize energy chart
        this.energyChart = null;
        this.initEnergyChart();
        
        // Bind UI elements
        this.bindUIElements();
        
        // Update the state info
        this.updateStableStatesInfo();
        
        // Render initial state
        this.updateModel();
    }
    
    /**
     * Initialize the energy landscape chart
     */
    initEnergyChart() {
        const ctx = document.getElementById('energy-chart').getContext('2d');
        
        // Calculate energy landscape
        const energyData = this.model.computeEnergyLandscape(0, 4, 100);
        
        // Create chart
        this.energyChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Energy Landscape',
                    data: energyData.map(point => ({ x: point[0], y: point[1] })),
                    borderColor: '#0d47a1',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        bottom: 50
                    }
                },
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
                            text: 'Height'
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
        
        // Mark stable states on the chart
        this.updateEnergyChartStableStates();
    }
    
    /**
     * Update the energy landscape chart with current model parameters
     */
    updateEnergyChart() {
        // Calculate new energy landscape
        const energyData = this.model.computeEnergyLandscape(0, 4, 100);
        
        // Update chart data
        this.energyChart.data.datasets[0].data = energyData.map(point => ({ x: point[0], y: point[1] }));
        
        // Update stable states markers
        this.updateEnergyChartStableStates();
        
        // Update chart
        this.energyChart.update();
    }
    
    /**
     * Add markers for stable states to the energy chart
     */
    updateEnergyChartStableStates() {
        // Remove existing stable state datasets
        this.energyChart.data.datasets = this.energyChart.data.datasets.filter(
            dataset => dataset.label === 'Energy Landscape'
        );
        
        // Get stable states
        const { state1, state2 } = this.model.findStableStates();
        
        // Add marker for first stable state if it exists
        if (state1) {
            const energy1 = this.model.computeEnergy(state1.h, state1.phi);
            this.energyChart.data.datasets.push({
                label: 'Stable State 1',
                data: [{ x: state1.h, y: energy1 }],
                backgroundColor: '#4caf50',
                borderColor: '#4caf50',
                pointRadius: 6,
                pointHoverRadius: 8,
                showLine: false
            });
        }
        
        // Add marker for second stable state if it exists
        if (state2) {
            const energy2 = this.model.computeEnergy(state2.h, state2.phi);
            this.energyChart.data.datasets.push({
                label: 'Stable State 2',
                data: [{ x: state2.h, y: energy2 }],
                backgroundColor: '#ff9800',
                borderColor: '#ff9800',
                pointRadius: 6,
                pointHoverRadius: 8,
                showLine: false
            });
        }
        
        // Add marker for current height
        const currentHeight = this.visualizer.currentHeight;
        const currentPhi = this.model.findEquilibriumTwistAngle(currentHeight);
        const currentEnergy = this.model.computeEnergy(currentHeight, currentPhi);
        
        this.energyChart.data.datasets.push({
            label: 'Current State',
            data: [{ x: currentHeight, y: currentEnergy }],
            backgroundColor: '#f44336',
            borderColor: '#f44336',
            pointRadius: 6,
            pointHoverRadius: 8,
            showLine: false
        });
    }
    
    /**
     * Bind UI elements to controller functions
     */
    bindUIElements() {
        // Parameter sliders
        document.getElementById('n-slider').addEventListener('input', (e) => {
            const n = parseInt(e.target.value);
            document.getElementById('n-value').textContent = n;
            this.updateModelParameter('n', n);
        });
        
        document.getElementById('a-slider').addEventListener('input', (e) => {
            const a = parseFloat(e.target.value);
            document.getElementById('a-value').textContent = a.toFixed(1);
            this.updateModelParameter('a', a);
        });
        
        document.getElementById('b-slider').addEventListener('input', (e) => {
            const b = parseFloat(e.target.value);
            document.getElementById('b-value').textContent = b.toFixed(1);
            this.updateModelParameter('b', b);
        });
        
        document.getElementById('c-slider').addEventListener('input', (e) => {
            const c = parseFloat(e.target.value);
            document.getElementById('c-value').textContent = c.toFixed(1);
            this.updateModelParameter('c', c);
        });
        
        document.getElementById('beta-slider').addEventListener('input', (e) => {
            const beta = parseFloat(e.target.value);
            document.getElementById('beta-value').textContent = beta.toFixed(1);
            this.updateModelParameter('beta', beta);
        });
        
        document.getElementById('height-slider').addEventListener('input', (e) => {
            const height = parseFloat(e.target.value);
            document.getElementById('height-value').textContent = height.toFixed(1);
            this.visualizer.setHeight(height);
            this.updateEnergyChart();
        });
        
        // Buttons
        document.getElementById('toggle-state-btn').addEventListener('click', () => {
            this.visualizer.toggleState();
            this.updateEnergyChart();
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetModel();
        });
        
        document.getElementById('animate-btn').addEventListener('click', () => {
            if (this.visualizer.currentState === 'deployed') {
                this.visualizer.animateToState('folded');
            } else {
                this.visualizer.animateToState('deployed');
            }
        });
        
        // Tab navigation
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // Update active tab button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update active tab content
                tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');
            });
        });
    }
    
    /**
     * Update a parameter of the Kresling model
     * @param {string} param - Parameter name
     * @param {number} value - New parameter value
     */
    updateModelParameter(param, value) {
        // Update model parameter
        this.model[param] = value;
        
        // Recalculate derived parameters
        if (['a', 'b', 'c', 'beta', 'n'].includes(param)) {
            this.model.d = Math.sqrt(this.model.b**2 + this.model.c**2 - 2 * this.model.b * this.model.c * Math.cos(this.model.beta));
            this.model.r = this.model.a / (2 * Math.sin(Math.PI / this.model.n));
            this.model.R = this.model.b / (2 * Math.sin(Math.PI / this.model.n));
            this.model.km = this.model.EA / this.model.c;
            this.model.kv = this.model.EA / this.model.d;
            
            // Clear cache for stable states
            this.model._stableStates = null;
        }
        
        // Update model and visualization
        this.updateModel();
    }
    
    /**
     * Update the model and visualization
     */
    updateModel() {
        // Update visualizer
        this.visualizer.setModel(this.model);
        
        // Update stable states info
        this.updateStableStatesInfo();
        
        // Update energy chart
        this.updateEnergyChart();
    }
    
    /**
     * Reset the model to default parameters
     */
    resetModel() {
        // Reset model to default parameters
        this.model = new KreslingModel();
        
        // Update UI sliders
        document.getElementById('n-slider').value = this.model.n;
        document.getElementById('n-value').textContent = this.model.n;
        
        document.getElementById('a-slider').value = this.model.a;
        document.getElementById('a-value').textContent = this.model.a.toFixed(1);
        
        document.getElementById('b-slider').value = this.model.b;
        document.getElementById('b-value').textContent = this.model.b.toFixed(1);
        
        document.getElementById('c-slider').value = this.model.c;
        document.getElementById('c-value').textContent = this.model.c.toFixed(1);
        
        document.getElementById('beta-slider').value = this.model.beta;
        document.getElementById('beta-value').textContent = this.model.beta.toFixed(1);
        
        document.getElementById('height-slider').value = 2.0;
        document.getElementById('height-value').textContent = '2.0';
        
        // Reset visualizer
        this.visualizer.setModel(this.model);
        this.visualizer.setState('deployed');
        
        // Update stable states info
        this.updateStableStatesInfo();
        
        // Update energy chart
        this.updateEnergyChart();
    }
    
    /**
     * Update the stable states information display
     */
    updateStableStatesInfo() {
        const stateInfoElement = document.getElementById('state-info-content');
        const { state1, state2 } = this.model.findStableStates();
        
        let html = '';
        
        if (state1 && state2) {
            // Bistable
            const energyBarrier = this.model.computeEnergyBarrier();
            
            html = `
                <div class="state-info-bistable">
                    <p><strong>Bistable Configuration</strong></p>
                    <div class="state-table">
                        <table>
                            <tr>
                                <th></th>
                                <th>Height</th>
                                <th>Twist Angle</th>
                            </tr>
                            <tr>
                                <td><strong>State 1</strong></td>
                                <td>${state1.h.toFixed(3)}</td>
                                <td>${state1.phi.toFixed(3)} rad</td>
                            </tr>
                            <tr>
                                <td><strong>State 2</strong></td>
                                <td>${state2.h.toFixed(3)}</td>
                                <td>${state2.phi.toFixed(3)} rad</td>
                            </tr>
                        </table>
                    </div>
                    <p><strong>Energy Barrier:</strong> ${energyBarrier.toFixed(5)}</p>
                </div>
            `;
        } else if (state1) {
            // Monostable with first stable state
            html = `
                <div class="state-info-monostable">
                    <p><strong>Monostable Configuration</strong></p>
                    <p><strong>Stable State:</strong></p>
                    <p>Height: ${state1.h.toFixed(3)}</p>
                    <p>Twist Angle: ${state1.phi.toFixed(3)} rad</p>
                </div>
            `;
        } else if (state2) {
            // Monostable with second stable state
            html = `
                <div class="state-info-monostable">
                    <p><strong>Monostable Configuration</strong></p>
                    <p><strong>Stable State:</strong></p>
                    <p>Height: ${state2.h.toFixed(3)}</p>
                    <p>Twist Angle: ${state2.phi.toFixed(3)} rad</p>
                </div>
            `;
        } else {
            // No stable states
            html = `
                <div class="state-info-unstable">
                    <p><strong>No stable states found with current parameters.</strong></p>
                    <p>Try adjusting parameters to find stable configurations.</p>
                </div>
            `;
        }
        
        stateInfoElement.innerHTML = html;
    }
}
