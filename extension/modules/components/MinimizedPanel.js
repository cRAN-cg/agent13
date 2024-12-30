import { Panel } from './Panel.js';

export class MinimizedPanel {
    #panelEl = null;
    #core = null;
    #dragState = null;
    #initialPosition = { x: 0, y: 0 };
    #currentPosition = { x: 0, y: 0 };
    #animationFrame = null;

    constructor(core, panelEl) {
        this.#core = core;
        this.#panelEl = panelEl;
        this.#initialPosition = {
            x: window.innerWidth - 60,
            y: window.innerHeight - 60
        };
        this.#currentPosition = { ...this.#initialPosition };
    }

    minimize() {
        // First: Get initial bounds
        const initialBounds = this.#panelEl.getBoundingClientRect();
        
        // Add collapsed class but maintain position
        this.#panelEl.classList.add('agent13-panel-collapsed');
        this.#panelEl.style.transform = `translate3d(${initialBounds.left}px, ${initialBounds.top}px, 0)`;
        this.#panelEl.style.transition = 'none';
        
        // Force reflow
        this.#panelEl.offsetHeight;
        
        // Last: Calculate final position
        const finalX = this.#initialPosition.x;
        const finalY = this.#initialPosition.y;
        
        // Invert & Play: Animate to final position
        requestAnimationFrame(() => {
            this.#panelEl.classList.add('transitioning');
            this.#panelEl.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
            this.#panelEl.style.transform = `translate3d(${finalX}px, ${finalY}px, 0) scale(0.95)`;
            
            // Subtle pop effect at the end
            setTimeout(() => {
                this.#panelEl.style.transform = `translate3d(${finalX}px, ${finalY}px, 0) scale(1)`;
            }, 300);
            
            // Setup drag handlers after animation
            this.#panelEl.addEventListener('transitionend', () => {
                this.#setupDragHandlers();
                this.#panelEl.addEventListener('dblclick', this.maximize.bind(this));
            }, { once: true });
        });
    }

    maximize() {
        // First: Get current bounds
        const currentBounds = this.#panelEl.getBoundingClientRect();
        
        // Remove collapsed class but maintain position
        this.#panelEl.style.transform = `translate3d(${currentBounds.left}px, ${currentBounds.top}px, 0)`;
        this.#panelEl.style.transition = 'none';
        this.#panelEl.classList.remove('agent13-panel-collapsed');
        
        // Force reflow
        this.#panelEl.offsetHeight;
        
        // Animate to expanded position with subtle scale
        requestAnimationFrame(() => {
            this.#panelEl.classList.add('transitioning');
            this.#panelEl.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
            this.#panelEl.style.transform = 'translate3d(0, 0, 0) scale(0.98)';
            
            // Subtle expand effect at the end
            setTimeout(() => {
                this.#panelEl.style.transform = 'translate3d(0, 0, 0) scale(1)';
            }, 300);
            this.#panelEl.classList.add('agent13-panel-visible');
            
            // Clean up after animation
            this.#panelEl.addEventListener('transitionend', () => {
                this.#cleanupDragHandlers();
                this.#panelEl.classList.remove('transitioning');
            }, { once: true });
        });
    }

    #setupDragHandlers() {
        this.#dragState = {
            isDragging: false,
            startX: 0,
            startY: 0,
            lastX: 0,
            lastY: 0,
            velocity: { x: 0, y: 0 },
            lastTime: 0
        };

        const onDragStart = (e) => {
            if (!this.#panelEl || e.button !== 0) return;
            e.preventDefault();
            
            this.#dragState.isDragging = true;
            this.#dragState.startX = e.clientX - this.#currentPosition.x;
            this.#dragState.startY = e.clientY - this.#currentPosition.y;
            this.#dragState.lastX = e.clientX;
            this.#dragState.lastY = e.clientY;
            this.#dragState.lastTime = performance.now();
            
            this.#panelEl.style.transition = 'none';
            this.#panelEl.style.cursor = 'grabbing';
            
            // Add subtle scale and rotation while dragging
            this.#panelEl.style.transform += ' scale(1.05) rotate(0.5deg)';
        };

        const onDrag = (e) => {
            if (!this.#dragState.isDragging) return;
            e.preventDefault();

            // Calculate velocity for momentum
            const now = performance.now();
            const dt = now - this.#dragState.lastTime;
            if (dt > 0) {
                this.#dragState.velocity.x = (e.clientX - this.#dragState.lastX) / dt;
                this.#dragState.velocity.y = (e.clientY - this.#dragState.lastY) / dt;
            }
            
            this.#dragState.lastX = e.clientX;
            this.#dragState.lastY = e.clientY;
            this.#dragState.lastTime = now;

            // Update position with smooth animation
            if (this.#animationFrame) cancelAnimationFrame(this.#animationFrame);
            this.#animationFrame = requestAnimationFrame(() => {
                const x = e.clientX - this.#dragState.startX;
                const y = e.clientY - this.#dragState.startY;
                this.#updatePosition(x, y);
            });
        };

        const onDragEnd = () => {
            if (!this.#dragState.isDragging) return;
            
            this.#dragState.isDragging = false;
            
            // Apply momentum with easing
            let momentum = {
                x: this.#dragState.velocity.x * 100,
                y: this.#dragState.velocity.y * 100
            };
            
            const animate = () => {
                if (Math.abs(momentum.x) < 0.1 && Math.abs(momentum.y) < 0.1) {
                    this.#panelEl.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
                    this.#panelEl.style.transform = this.#panelEl.style.transform.replace(' scale(1.05) rotate(0.5deg)', '');
                    this.#panelEl.style.cursor = 'grab';
                    return;
                }
                
                const x = this.#currentPosition.x + momentum.x;
                const y = this.#currentPosition.y + momentum.y;
                this.#updatePosition(x, y);
                
                momentum.x *= 0.95;
                momentum.y *= 0.95;
                requestAnimationFrame(animate);
            };
            
            animate();
        };

        // Add event listeners
        this.#panelEl.addEventListener('mousedown', onDragStart);
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', onDragEnd);
        
        // Store handlers for cleanup
        this.#dragState.cleanup = () => {
            this.#panelEl.removeEventListener('mousedown', onDragStart);
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', onDragEnd);
            if (this.#animationFrame) {
                cancelAnimationFrame(this.#animationFrame);
                this.#animationFrame = null;
            }
        };
    }

    #updatePosition(x, y) {
        // Keep panel partially visible with smooth edge bounce
        const bounds = this.#panelEl.getBoundingClientRect();
        const minX = -bounds.width + 20;
        const maxX = window.innerWidth - 20;
        const minY = -bounds.height + 20;
        const maxY = window.innerHeight - 20;
        
        // Add subtle bounce effect when hitting edges
        const bounceX = this.#calculateBounce(x, minX, maxX);
        const bounceY = this.#calculateBounce(y, minY, maxY);
        
        // Update transform with both translation and scale
        const transform = this.#dragState?.isDragging ? 'scale(1.05) rotate(0.5deg)' : '';
        this.#panelEl.style.transform = `translate3d(${bounceX}px, ${bounceY}px, 0) ${transform}`;
        
        // Store the actual position without bounce
        this.#currentPosition = {
            x: Math.max(minX, Math.min(maxX, x)),
            y: Math.max(minY, Math.min(maxY, y))
        };
    }

    #calculateBounce(value, min, max) {
        if (value < min) {
            const overflow = min - value;
            return min - (overflow * 0.2); // Subtle bounce
        }
        if (value > max) {
            const overflow = value - max;
            return max + (overflow * 0.2); // Subtle bounce
        }
        return value;
    }

    #cleanupDragHandlers() {
        if (this.#dragState?.cleanup) {
            this.#dragState.cleanup();
            this.#dragState = null;
        }
        if (this.#animationFrame) {
            cancelAnimationFrame(this.#animationFrame);
            this.#animationFrame = null;
        }
        this.#panelEl.removeEventListener('dblclick', this.maximize.bind(this));
    }

    destroy() {
        this.#cleanupDragHandlers();
        this.#panelEl = null;
        this.#core = null;
    }
}
