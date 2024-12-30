import { Header } from './Header.js';
import { Messages } from './Messages.js';
import { Input } from './Input.js';

export class Panel {
    static STATES = {
        EXPANDED: 'expanded',
        COLLAPSED: 'collapsed',
        HIDDEN: 'hidden'
    };

    #panelEl = null;
    #contentEl = null;
    #state = Panel.STATES.HIDDEN;
    #core = null;
    #dragHandlers = null;

    // Component instances
    #header = null;
    #messages = null;
    #input = null;

    constructor(core) {
        this.#core = core;
        this.#initComponents();
    }

    #initComponents() {
        this.#header = new Header(this.#core, () => this.toggle());
        this.#messages = new Messages(this.#core);
        this.#input = new Input(this.#core);
    }

    getState() {
        return this.#state;
    }

    getContentEl() {
        return this.#contentEl;
    }

    create() {
        try {
            
            // If panel already exists, just make it visible
            if (this.#panelEl) {
                
                try {
                    // Ensure panel is visible and expanded
                    this.#panelEl.style.visibility = 'visible';
                    this.#panelEl.style.opacity = '1';
                    this.#panelEl.style.pointerEvents = 'all';
                    this.#panelEl.style.transform = 'translate3d(0, 0, 0)';
                    
                    this.#panelEl.classList.remove('agent13-panel-collapsed');
                    this.#panelEl.classList.add('agent13-panel-visible');
                    this.#panelEl.classList.remove('agent13-panel-initializing');
                    
                    this.#state = Panel.STATES.EXPANDED;
                    this.#header.updateCollapseButton(true);
                    this.#core.state.set('isExpanded', true);
                    
                    return true;
                } catch (error) {
                    console.error('[Agent13] Error making panel visible:', error);
                    // Try to recover by removing the broken panel and creating a new one
                    this.#panelEl.remove();
                    this.#panelEl = null;
                }
            }


        this.#panelEl = document.createElement('div');
        this.#panelEl.className = 'agent13-panel agent13-panel-initializing';
        this.#panelEl.style.zIndex = '2147483647';
        
        // Set initial styles
        this.#panelEl.style.visibility = 'hidden';
        this.#panelEl.style.opacity = '0';
        this.#panelEl.style.pointerEvents = 'none';
        
        // Create and add components
        const headerEl = this.#header.create('expanded');
        this.#contentEl = document.createElement('div');
        this.#contentEl.className = 'agent13-panel-content';
        
        const messagesEl = this.#messages.create();
        this.#contentEl.appendChild(messagesEl);
        
        const inputEl = this.#input.create();
        const resizer = this.#createResizer();
        
        this.#panelEl.appendChild(headerEl);
        this.#panelEl.appendChild(this.#contentEl);
        this.#panelEl.appendChild(inputEl);
        this.#panelEl.appendChild(resizer);
        
            try {
                // First append to DOM
                document.body.appendChild(this.#panelEl);
                
                // Force reflow before changing properties
                this.#panelEl.offsetHeight;
                
                // Make panel visible with transition
                requestAnimationFrame(() => {
                    try {
                        if (!this.#panelEl) {
                            console.error('[Agent13] Panel element lost during animation frame');
                            return;
                        }
                        
                        this.#panelEl.style.visibility = 'visible';
                        this.#panelEl.style.opacity = '1';
                        this.#panelEl.style.pointerEvents = 'all';
                        this.#panelEl.style.transform = 'translate3d(0, 0, 0)';
                        
                        this.#panelEl.classList.remove('agent13-panel-initializing');
                        this.#panelEl.classList.add('agent13-panel-visible');
                        
                        this.#input.focus();
                    } catch (error) {
                        console.error('[Agent13] Error in animation frame:', error);
                    }
                });
                
                // Update states
                this.#state = Panel.STATES.EXPANDED;
                this.#core.state.set('isExpanded', true);
                
                return true;
            } catch (error) {
                console.error('[Agent13] Failed to create panel:', error);
                console.error(error.stack);
                if (this.#panelEl && this.#panelEl.parentNode) {
                    this.#panelEl.remove();
                }
                this.#panelEl = null;
                return false;
            }
        } catch (error) {
            console.error('[Agent13] Critical error in panel creation:', error);
            console.error(error.stack);
            return false;
        }
    }

    #createResizer() {
        const resizer = document.createElement('div');
        resizer.className = 'agent13-panel-resizer';
        
        let isResizing = false;
        let startWidth;
        let startX;
        
        const onMouseMove = (e) => {
            if (!isResizing) return;
            
            const newWidth = startWidth + (e.clientX - startX);
            const minWidth = parseInt(getComputedStyle(this.#panelEl).minWidth);
            const maxWidth = window.innerWidth * 0.8;
            
            this.#panelEl.style.width = Math.min(Math.max(newWidth, minWidth), maxWidth) + 'px';
        };
        
        const onMouseUp = () => {
            isResizing = false;
            resizer.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isResizing = true;
            startWidth = this.#panelEl.offsetWidth;
            startX = e.clientX;
            resizer.classList.add('dragging');
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        
        return resizer;
    }

    #setupDragHandlers() {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        
        const dragStart = (e) => {
            e.preventDefault();
            initialX = e.clientX - currentX;
            initialY = e.clientY - currentY;
            isDragging = true;
        };
        
        const drag = (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                
                // Keep within viewport bounds
                const bounds = this.#panelEl.getBoundingClientRect();
                const maxX = window.innerWidth - bounds.width;
                const maxY = window.innerHeight - bounds.height;
                
                currentX = Math.min(Math.max(0, currentX), maxX);
                currentY = Math.min(Math.max(0, currentY), maxY);
                
                this.#panelEl.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        };
        
        const dragEnd = () => {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        };

        // Get current position
        const rect = this.#panelEl.getBoundingClientRect();
        currentX = rect.left;
        currentY = rect.top;

        return { dragStart, drag, dragEnd };
    }

    toggle() {
        if (!this.#panelEl) return;

        if (this.#state === Panel.STATES.EXPANDED) {
            // First remove visible class to trigger transition
            this.#panelEl.classList.remove('agent13-panel-visible');
            this.#panelEl.style.visibility = 'hidden';
            this.#panelEl.style.opacity = '0';
            
            // Wait for transition before adding collapsed state
            setTimeout(() => {
                if (!this.#panelEl) return;
                
                this.#panelEl.classList.add('agent13-panel-collapsed');
                this.#header.updateCollapseButton(false);
                this.#state = Panel.STATES.COLLAPSED;
                
                // Make visible again in collapsed state
                this.#panelEl.style.visibility = 'visible';
                this.#panelEl.style.opacity = '1';
            }, 400); // Match transition-bounce duration
            
            // Setup drag handlers
            if (!this.#dragHandlers) {
                this.#dragHandlers = this.#setupDragHandlers();
            }
            
            // Add mouse event listeners
            this.#panelEl.addEventListener('mousedown', this.#dragHandlers.dragStart, false);
            document.addEventListener('mousemove', this.#dragHandlers.drag, false);
            document.addEventListener('mouseup', this.#dragHandlers.dragEnd, false);
            
        } else {
            this.#panelEl.classList.remove('agent13-panel-collapsed');
            this.#header.updateCollapseButton(true);
            this.#state = Panel.STATES.EXPANDED;
            
            // Remove drag event listeners
            if (this.#dragHandlers) {
                this.#panelEl.removeEventListener('mousedown', this.#dragHandlers.dragStart, false);
                document.removeEventListener('mousemove', this.#dragHandlers.drag, false);
                document.removeEventListener('mouseup', this.#dragHandlers.dragEnd, false);
            }
            
            // Reset transform and ensure visibility
            this.#panelEl.style.transform = '';
            this.#panelEl.style.visibility = 'visible';
            this.#panelEl.style.opacity = '1';
            this.#panelEl.style.pointerEvents = 'all';
        }
    }

    async addMessage(message) {
        if (!this.#panelEl) {
            this.create();
        }
        await this.#messages.addMessage(message);
    }

    destroy() {
        this.#header.destroy();
        this.#messages.destroy();
        this.#input.destroy();
        
        if (this.#panelEl) {
            
            // Update state before removing panel
            this.#core.state.set('isExpanded', false);
            
            // Fade out panel
            this.#panelEl.style.opacity = '0';
            this.#panelEl.style.visibility = 'hidden';
            this.#panelEl.style.pointerEvents = 'none';
            
            setTimeout(() => {
                if (!this.#panelEl) return;
                
                this.#panelEl.remove();
                this.#panelEl = null;
                this.#contentEl = null;
                this.#state = Panel.STATES.HIDDEN;
                this.#dragHandlers = null;
                
                // Emit panel:destroyed event
                this.#core.events.emit('panel:destroyed');
            }, 300);
        }
    }
}
