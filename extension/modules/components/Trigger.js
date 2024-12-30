export class Trigger {
    #triggerEl = null;
    #core = null;
    #isVisible = false;

    constructor(core) {
        this.#core = core;
    }

    isVisible() {
        return this.#isVisible && this.#triggerEl !== null;
    }

    create(text, position) {
        // If trigger exists for same text, just update position
        if (this.#triggerEl && this.#triggerEl.dataset.text === text) {
            this.#positionTrigger(this.#triggerEl, position);
            return;
        }
        
        // Remove any existing trigger
        this.destroy();

        // Create new trigger
        const wrapper = document.createElement('div');
        wrapper.className = 'agent13-trigger-wrapper';
        wrapper.dataset.text = text;
        
        const triggerBtn = document.createElement('div');
        triggerBtn.className = 'agent13-trigger';
        triggerBtn.title = 'Ask agent13 about this text';
        
        // Add icon text as span
        const iconText = document.createElement('span');
        iconText.className = 'agent13-trigger-icon';
        iconText.textContent = 'C';
        triggerBtn.appendChild(iconText);
        
        // Add click handler to both wrapper and button
        const clickHandler = async (e) => {
            // Stop event immediately
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            
            // Add visual feedback
            wrapper.classList.add('clicked');
            
            try {
                // Emit the trigger click event with the text
                await this.#core.events.emit('trigger:click', text);
            } catch (error) {
                console.error('[Agent13] Error emitting trigger:click event:', error);
            }
            
            // Small delay to ensure event is processed
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Remove trigger after click
            this.destroy();
            
            return false; // Prevent any other handlers
        };

        // Use capture phase to handle click before other listeners
        wrapper.addEventListener('click', clickHandler, true);
        triggerBtn.addEventListener('click', clickHandler, true);
        
        // Also prevent mousedown to ensure click isn't interrupted
        const preventMouseDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };
        wrapper.addEventListener('mousedown', preventMouseDown, true);
        triggerBtn.addEventListener('mousedown', preventMouseDown, true);
        
        wrapper.appendChild(triggerBtn);
        document.body.appendChild(wrapper);
        this.#triggerEl = wrapper;
        this.#isVisible = true;
        
        // Position after adding to DOM to ensure proper layout calculation
        this.#positionTrigger(wrapper, position);
    }

    #positionTrigger(wrapper, position) {
        
        // Set initial position
        wrapper.style.position = 'fixed';
        wrapper.style.zIndex = '2147483647';
        wrapper.style.transform = 'translate(-50%, -50%)';
        wrapper.style.left = `${position.x}px`;
        wrapper.style.top = `${position.y}px`;
        
        // Get trigger dimensions after it's in the DOM
        const rect = wrapper.getBoundingClientRect();
        
        // Ensure trigger stays within viewport
        const margin = 10;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let finalX = position.x;
        let finalY = position.y;
        
        // Adjust horizontal position if needed
        if (rect.right > viewportWidth - margin) {
            finalX = viewportWidth - margin - (rect.width / 2);
        }
        if (rect.left < margin) {
            finalX = margin + (rect.width / 2);
        }
        
        // Adjust vertical position if needed
        if (rect.bottom > viewportHeight - margin) {
            finalY = viewportHeight - margin - (rect.height / 2);
        }
        if (rect.top < margin) {
            finalY = margin + (rect.height / 2);
        }
        
        // Apply final position
        wrapper.style.left = `${finalX}px`;
        wrapper.style.top = `${finalY}px`;
        
        
    }

    destroy() {
        if (this.#triggerEl) {
            this.#triggerEl.remove();
            this.#triggerEl = null;
            this.#isVisible = false;
        }
    }
}
