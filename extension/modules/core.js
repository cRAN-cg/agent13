// Core functionality module
export class Settings {
    async #ensureStorageAccess() {
        if (!chrome?.runtime?.id) {
            throw new Error('Extension context is not available');
        }
        if (!chrome?.storage?.local) {
            throw new Error('Chrome storage API is not available');
        }
    }

    async getApiKey() {
        await this.#ensureStorageAccess();
        try {
            const { anthropicApiKey } = await chrome.storage.local.get('anthropicApiKey');
            return anthropicApiKey;
        } catch (error) {
            console.error('[Agent13] Failed to get API key:', error);
            throw new Error('Failed to access storage. Please reload the extension.');
        }
    }

    async setApiKey(key) {
        await this.#ensureStorageAccess();
        try {
            await chrome.storage.local.set({ anthropicApiKey: key });
        } catch (error) {
            console.error('[Agent13] Failed to set API key:', error);
            throw new Error('Failed to save API key. Please reload the extension.');
        }
    }

    async load() {
        await this.#ensureStorageAccess();
        try {
            return await chrome.storage.local.get(['anthropicApiKey', 'settings']);
        } catch (error) {
            console.error('[Agent13] Failed to load settings:', error);
            throw new Error('Failed to load settings. Please reload the extension.');
        }
    }

    async save(settings) {
        await this.#ensureStorageAccess();
        try {
            await chrome.storage.local.set({ settings });
        } catch (error) {
            console.error('[Agent13] Failed to save settings:', error);
            throw new Error('Failed to save settings. Please reload the extension.');
        }
    }
}

export class State {
    #state = {
        isExpanded: false,
        currentConversationId: null,
        conversations: new Map()
    };
    #core = null;

    constructor(core) {
        this.#core = core;
    }

    get(key) {
        return this.#state[key];
    }

    set(key, value) {
        this.#state[key] = value;
        this.#core.events.emit(`state:change:${key}`, value);
    }

    toggle(key) {
        this.#state[key] = !this.#state[key];
        this.#core.events.emit(`state:change:${key}`, this.#state[key]);
    }
}

export class Events {
    #handlers = new Map();
    #debugId = Math.random().toString(36).substr(2, 9);

    constructor() {
    }

    on(event, handler) {
        if (!this.#handlers.has(event)) {
            this.#handlers.set(event, new Set());
        }
        this.#handlers.get(event).add(handler);
    }

    off(event, handler) {
        if (this.#handlers.has(event)) {
            this.#handlers.get(event).delete(handler);
        }
    }

    async emit(event, data) {
        
        const handlers = this.#handlers.get(event);
        if (handlers && handlers.size > 0) {
            
            const promises = [];
            for (const handler of handlers) {
                promises.push((async () => {
                    try {
                        const result = handler(data);
                        // If handler returns a promise, wait for it
                        if (result && typeof result.then === 'function') {
                            await result;
                        }
                    } catch (error) {
                        console.error(`[Agent13] Error in event handler for ${event}:`, error);
                        console.error(error.stack);
                        throw error; // Re-throw to mark this handler as failed
                    }
                })());
            }
            
            try {
                await Promise.all(promises);
            } catch (error) {
                console.error(`[Agent13] Some handlers failed for ${event}`);
                throw error; // Re-throw to indicate event emission failed
            }
        } else {
        }
    }
}

export class Core {
    settings = new Settings();
    state = null;
    events = new Events();
    ui = null; // UI instance will be set by App
    
    constructor() {
        this.state = new State(this);
    }

    static init() {
        return new Core();
    }
}
