let conversationManager = null;

class ConversationManager {
    static #API_ENDPOINT = 'https://api.anthropic.com/v1/messages';
    static #DEFAULT_MODEL = 'claude-3-sonnet-20240229';
    static #CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
    static #MAX_CONVERSATION_AGE = 30 * 60 * 1000; // 30 minutes

    #conversations = new Map();

    constructor() {
        this.#initMessageListener();
        this.#initCleanupInterval();
    }

    async #getApiKey() {
        try {
            if (!chrome?.storage?.local) {
                throw new Error('Chrome storage API is not available');
            }
            const { anthropicApiKey } = await chrome.storage.local.get('anthropicApiKey');
            return anthropicApiKey;
        } catch (error) {
            console.error('[Agent13] Failed to get API key:', error);
            throw new Error('Failed to access storage. Extension may need to be reloaded.');
        }
    }

    async #handleMessage(text, conversationId = null) {
        try {
            const apiKey = await this.#getApiKey();
            if (!apiKey) {
                throw new Error('Please set your API key in the extension settings');
            }

            let messages = [];
            if (conversationId && this.#conversations.has(conversationId)) {
                messages = this.#conversations.get(conversationId);
            } else {
                conversationId = `conv_${Date.now()}`;
            }

            messages.push({
                role: 'user',
                content: text
            });

            const response = await fetch(ConversationManager.#API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'anthropic-version': '2023-06-01',
                    'x-api-key': apiKey,
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: ConversationManager.#DEFAULT_MODEL,
                    max_tokens: 1024,
                    messages,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error?.message || 'API request failed');
            }

            const { content } = await response.json();
            const assistantMessage = content[0].text;

            messages.push({
                role: 'assistant',
                content: assistantMessage
            });

            this.#conversations.set(conversationId, messages);

            return { 
                explanation: assistantMessage,
                conversationId
            };
        } catch (error) {
            console.error('Error:', error);
            return { error: error.message };
        }
    }

    #initMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === 'EXPLAIN_TEXT') {
                this.#handleMessage(request.text, request.conversationId)
                    .then(sendResponse)
                    .catch(error => sendResponse({ error: error.message }));
                return true;
            }
        });
    }

    #initCleanupInterval() {
        setInterval(() => {
            const now = Date.now();
            
            this.#conversations.forEach((messages, id) => {
                const [, timestamp] = id.split('_');
                if (now - parseInt(timestamp) > ConversationManager.#MAX_CONVERSATION_AGE) {
                    this.#conversations.delete(id);
                }
            });
        }, ConversationManager.#CLEANUP_INTERVAL);
    }
}

// Initialize the conversation manager with context check
function initializeManager() {
    if (typeof chrome.app?.isInstalled === 'undefined') {
        console.error('[Agent13] Extension context is invalid');
        return;
    }
    
    if (!conversationManager) {
        try {
            conversationManager = new ConversationManager();
        } catch (error) {
            console.error('[Agent13] Failed to initialize conversation manager:', error);
        }
    }
}

// Handle extension context changes
chrome.runtime.onStartup.addListener(() => {
    if (typeof chrome.app?.isInstalled !== 'undefined') {
        initializeManager();
    }
});

chrome.runtime.onInstalled.addListener(() => {
    if (typeof chrome.app?.isInstalled !== 'undefined') {
        initializeManager();
    }
});

// Initial initialization if context is valid
if (typeof chrome.app?.isInstalled !== 'undefined') {
    initializeManager();
}
