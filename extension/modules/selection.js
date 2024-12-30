class SelectionHandler {
    #core = null;
    #isCreatingTrigger = false;
    #lastSelection = null;
    #lastPosition = null;

    constructor(core) {
        this.#core = core;
        this.#init();
        
        // Listen for panel destroyed event
        this.#core.events.on('panel:destroyed', () => {
            if (this.#lastSelection && this.#lastPosition) {
                this.#core.ui.Trigger.create(this.#lastSelection, this.#lastPosition);
            }
        });
    }
    
    #init() {
        // Handle mouse up events
        document.addEventListener('mouseup', (e) => {
            setTimeout(() => this.#handleSelection(e), 10);
        });
        
        // Handle selection changes
        document.addEventListener('selectionchange', () => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            // If selection is cleared or empty, remove the trigger
            if (!selectedText) {
                this.#core.ui.Trigger.destroy();
                this.#lastSelection = null;
                this.#lastPosition = null;
                return;
            }

            // Store last selection for comparison
            if (selectedText !== this.#lastSelection) {
                this.#lastSelection = selectedText;
            }
        });

        // Handle clicks outside selection
        document.addEventListener('mousedown', (e) => {
            
            // First check if click is on trigger
            const triggerEl = document.querySelector('.agent13-trigger-wrapper');
            if (triggerEl && (e.target === triggerEl || triggerEl.contains(e.target))) {
                return;
            }

            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Check if click is outside selection area
            if (e.clientX < rect.left || e.clientX > rect.right || 
                e.clientY < rect.top || e.clientY > rect.bottom) {
                this.#core.ui.Trigger.destroy();
                this.#lastSelection = null;
                this.#lastPosition = null;
            }
        });
        
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.#core.ui.Trigger.destroy();
                this.#lastSelection = null;
                this.#lastPosition = null;
            }
        });
    }
    
    #handleSelection = (event) => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (!selectedText) {
            this.#core.ui.Trigger.destroy();
            this.#lastSelection = null;
            return;
        }
        
        // Don't recreate if same text is selected
        if (selectedText === this.#lastSelection && this.#core.ui.Trigger.isVisible()) {
            return;
        }
        
        try {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Calculate position relative to viewport
            const viewportX = rect.right + 10; // Increased offset from text
            const viewportY = rect.top + (rect.height / 2);
            
            // Store position for recreating trigger later
            this.#lastPosition = {
                x: viewportX,
                y: viewportY
            };
            
            // Create trigger with viewport-relative position
            this.#core.ui.Trigger.create(selectedText, this.#lastPosition);
            
            this.#lastSelection = selectedText;
        } catch (error) {
            this.#lastSelection = null;
            this.#lastPosition = null;
            this.#core.ui.Trigger.destroy();
        }
    }
}

export default SelectionHandler;
