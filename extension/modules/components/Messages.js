import { transformMarkdown } from '../markdown.js';

export class Messages {
    #container = null;
    #core = null;

    constructor(core) {
        this.#core = core;
    }

    create() {
        this.#container = document.createElement('div');
        this.#container.className = 'agent13-messages-container';
        return this.#container;
    }

    async addMessage({ type, text }) {
        if (!this.#container) return;

        const messageEl = document.createElement('div');
        messageEl.className = `agent13-${type}`;

        switch (type) {
            case 'query':
                messageEl.textContent = text;
                break;
            
            case 'loading':
                messageEl.textContent = 'Agent13 is thinking...';
                break;
            
            case 'response':
                try {
                    const formattedHtml = transformMarkdown(text);
                    messageEl.innerHTML = formattedHtml;
                } catch (error) {
                    console.error('[Agent13 Messages] Failed to format markdown:', error);
                    messageEl.textContent = text;
                }
                break;
            
            case 'error':
                messageEl.textContent = text;
                break;
            
            default:
                messageEl.textContent = text;
        }

        this.#container.appendChild(messageEl);
        this.scrollToBottom();
    }

    scrollToBottom() {
        if (this.#container) {
            const parent = this.#container.parentElement;
            if (parent) {
                parent.scrollTop = parent.scrollHeight;
            }
        }
    }

    clear() {
        if (this.#container) {
            this.#container.innerHTML = '';
        }
    }

    destroy() {
        this.#container?.remove();
        this.#container = null;
    }
}
