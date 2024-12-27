class SelectionHandler {
    #core = null;
    #isCreatingTrigger = false;

    constructor(core) {
        this.#core = core;
        this.#init();
    }
    
    #init() {
        console.log('[Agent13] Initializing selection handler');
        
        document.addEventListener('mouseup', (e) => {
            console.log('[Agent13] Mouse up event detected');
            setTimeout(() => this.#handleSelection(e), 10);
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.#core.ui.Trigger.destroy();
            }
        });
        
        console.log('[Agent13] Selection handler initialized');
    }
    
    #handleSelection = (event) => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        console.log('[Agent13] Selection detected:', { 
            hasText: !!selectedText,
            text: selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : ''),
            isCreatingTrigger: this.#isCreatingTrigger 
        });
        
        if (!selectedText || this.#isCreatingTrigger) {
            return;
        }
        
        try {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            this.#isCreatingTrigger = true;
            this.#core.ui.Trigger.destroy(); // Clean up any existing trigger
            
            // Calculate absolute position (viewport position + scroll offset)
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            
            // Create new trigger using UI module with absolute position
            this.#core.ui.Trigger.create(selectedText, {
                x: rect.right + 5 + scrollX,
                y: rect.top + (rect.height / 2) + scrollY
            });
            
            this.#isCreatingTrigger = false;
        } catch (error) {
            console.error('[Agent13] Error handling selection:', error);
            this.#isCreatingTrigger = false;
        }
    }
}

export default SelectionHandler;
