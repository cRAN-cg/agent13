class App {
    static #instance = null;

    static async #loadModules() {
        try {
            // Check if extension context is still valid
            if (!chrome?.runtime?.id) {
                throw new Error('Extension context is not available');
            }

            const extensionUrl = chrome.runtime.getURL('');
            const [{ Core }, { UI }, { API }, SelectionModule] = await Promise.all([
                import(extensionUrl + 'modules/core.js'),
                import(extensionUrl + 'modules/ui.js'),
                import(extensionUrl + 'modules/api.js'),
                import(extensionUrl + 'modules/selection.js')
            ]);
            return { Core, UI, API, SelectionHandler: SelectionModule.default };
        } catch (error) {
            throw error;
        }
    }

    static async getInstance() {
        if (!App.#instance) {
            App.#instance = new App();
            await App.#instance.init();
        }
        return App.#instance;
    }

    #core = null;
    #ui = null;
    #api = null;
    #isInitialized = false;

    async #handleMessage(text) {
        try {
            // Show user message immediately
            this.#ui.Panel.addMessage({ type: 'query', text });
            
            // Show loading state
            this.#ui.Panel.addMessage({ type: 'loading', text: '' });
            
            const response = await this.#api.sendMessage(text, this.#core.state.get('currentConversationId'));
            this.#core.state.set('currentConversationId', response.conversationId);
            
            // Remove loading message
            const loadingEl = this.#ui.Panel.getContentEl().querySelector('.agent13-loading');
            if (loadingEl) loadingEl.remove();
            
            // Show response with typing animation
            this.#ui.Panel.addMessage({ type: 'response', text: response.explanation });
        } catch (error) {
            // Remove loading message if there's an error
            const loadingEl = this.#ui.Panel.getContentEl().querySelector('.agent13-loading');
            if (loadingEl) loadingEl.remove();
            
            this.#ui.Panel.addMessage({ type: 'error', text: error.message });
        }
    }

    #handlePanelState() {
        const isExpanded = this.#core.state.get('isExpanded');
        const panel = this.#ui.Panel;

        if (isExpanded && panel.getState() === 'collapsed') {
            panel.toggle();
        } else if (!isExpanded && panel.getState() === 'expanded') {
            panel.toggle();
        }
    }

    #setupEventHandlers() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.#ui.Panel.destroy();
                this.#ui.Trigger.destroy();
            }
        });

        this.#core.events.on('trigger:click', async (text) => {
            try {
                // Create panel first to show feedback
                const panelCreated = this.#ui.Panel.create();
                if (!panelCreated) {
                    throw new Error('Failed to create panel');
                }

                // Check API key
                const apiKey = await this.#core.settings.getApiKey();
                if (!apiKey) {
                    await this.#ui.Panel.addMessage({ 
                        type: 'error', 
                        text: 'Please set your API key in the extension settings. Click the settings icon in the top right to configure.' 
                    });
                    return;
                }
                
                // Add messages after panel is ready
                
                // Add messages after panel is ready
                await this.#ui.Panel.addMessage({ type: 'query', text });
                await this.#ui.Panel.addMessage({ type: 'loading', text: '' });
                
                // Send message to API
                const response = await this.#api.sendMessage(text, this.#core.state.get('currentConversationId'));
                this.#core.state.set('currentConversationId', response.conversationId);
                
                // Remove loading message
                const loadingEl = this.#ui.Panel.getContentEl()?.querySelector('.agent13-loading');
                if (loadingEl) loadingEl.remove();
                
                // Show response with typing animation
                await this.#ui.Panel.addMessage({ type: 'response', text: response.explanation });
            } catch (error) {
                // Remove loading message if there's an error
                const loadingEl = this.#ui.Panel.getContentEl()?.querySelector('.agent13-loading');
                if (loadingEl) loadingEl.remove();
                
                console.error('[Agent13] Error in trigger:click handler:', error);
                // Try to show error in panel
                const panelCreated = this.#ui.Panel.create();
                if (panelCreated) {
                    await this.#ui.Panel.addMessage({ type: 'error', text: error.message });
                }
            }
        });

        this.#core.events.on('message:send', (text) => this.#handleMessage(text));
        
        this.#core.events.on('settings:open', () => {
            // Open settings in a new tab
            chrome.runtime.openOptionsPage();
        });

        this.#core.events.on('state:change:isExpanded', () => this.#handlePanelState());
    }

    async init() {
        if (this.#isInitialized) return;

        try {
            const { Core, UI, API, SelectionHandler } = await App.#loadModules();
            
            // Initialize core and store UI instance on it
            this.#core = Core.init();
            this.#ui = UI.init(this.#core);
            this.#api = API.init(this.#core);
            
            // Attach UI instance to core for other modules to access
            this.#core.ui = this.#ui;
            
            // Setup event handlers before initializing selection
            this.#setupEventHandlers();
            
            // Initialize selection handler with core that has UI access
            new SelectionHandler(this.#core);

            this.#isInitialized = true;
        } catch (error) {
            throw error;
        }
    }

    static async init() {
        return new App().init();
    }
}

export default App;
