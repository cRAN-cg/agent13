import { Core } from './core.js';

export class API {
    static #API_ENDPOINT = 'https://api.anthropic.com/v1/messages';
    static #DEFAULT_MODEL = 'claude-3-sonnet-20240229';
    static #CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
    static #MAX_CONVERSATION_AGE = 30 * 60 * 1000; // 30 minutes

    static #ERRORS = {
        NO_API_KEY: "API key not found. Please set it in settings.",
        INVALID_API_KEY: "Invalid API key. Please check your settings.",
        NETWORK_ERROR: "Network error. Please check your connection.",
        API_ERROR: "API request failed: "
    };

    #core = null;

    constructor(core) {
        if (!core) throw new Error("Core module required");
        this.#core = core;
        this.#startCleanupInterval();
    }

    async sendMessage(text, conversationId = null) {
        try {
            const apiKey = await this.#core.settings.getApiKey();
            if (!apiKey) {
                throw new Error(API.#ERRORS.NO_API_KEY);
            }

            let messages = [];
            if (conversationId && this.#core.state.get('conversations').has(conversationId)) {
                messages = this.#core.state.get('conversations').get(conversationId);
            } else {
                conversationId = `conv_${Date.now()}`;
            }

            messages.push({
                role: 'user',
                content: text
            });

            const response = await fetch(API.#API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'anthropic-version': '2023-06-01',
                    'x-api-key': apiKey,
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: API.#DEFAULT_MODEL,
                    max_tokens: 1024,
                    messages: messages,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const error = await response.json();
                if (response.status === 401) {
                    throw new Error(API.#ERRORS.INVALID_API_KEY);
                }
                throw new Error(API.#ERRORS.API_ERROR + (error.error?.message || response.statusText));
            }

            const { content } = await response.json();
            const assistantMessage = content[0].text;

            messages.push({
                role: 'assistant',
                content: assistantMessage
            });

            this.#core.state.get('conversations').set(conversationId, messages);

            return { 
                explanation: assistantMessage,
                conversationId
            };
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error(API.#ERRORS.NETWORK_ERROR);
            }
            throw error;
        }
    }

    #startCleanupInterval() {
        setInterval(() => {
            const now = Date.now();
            const conversations = this.#core.state.get('conversations');
            
            conversations.forEach((messages, id) => {
                const [, timestamp] = id.split('_');
                if (now - parseInt(timestamp) > API.#MAX_CONVERSATION_AGE) {
                    conversations.delete(id);
                }
            });
        }, API.#CLEANUP_INTERVAL);
    }

    static init(core) {
        return new API(core);
    }
}
