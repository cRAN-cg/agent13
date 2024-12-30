export class Input {
    #container = null;
    #inputEl = null;
    #core = null;

    constructor(core) {
        this.#core = core;
    }

    create() {
        this.#container = document.createElement('div');
        this.#container.className = 'agent13-input-container';
        
        this.#inputEl = document.createElement('textarea');
        this.#inputEl.className = 'agent13-input';
        this.#inputEl.placeholder = 'Message agent13...';
        
        this.#setupEventListeners();
        
        this.#container.appendChild(this.#inputEl);
        return this.#container;
    }

    #setupEventListeners() {
        this.#inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.#handleSubmit();
            }
        });
    }

    #handleSubmit() {
        const value = this.#inputEl.value.trim();
        if (value) {
            this.#core.events.emit('message:send', value);
            this.#inputEl.value = '';
        }
    }

    focus() {
        this.#inputEl?.focus();
    }

    clear() {
        if (this.#inputEl) {
            this.#inputEl.value = '';
        }
    }

    destroy() {
        this.#container?.remove();
        this.#container = null;
        this.#inputEl = null;
    }
}
