import { Core } from './core.js';

let marked = null;

class Panel {
    static STATES = {
        EXPANDED: 'expanded',
        COLLAPSED: 'collapsed',
        HIDDEN: 'hidden'
    };

    #panelEl = null;
    #contentEl = null;
    #state = Panel.STATES.HIDDEN;
    #core = null;

    constructor(core) {
        this.#core = core;
    }

    getState() {
        return this.#state;
    }

    getContentEl() {
        return this.#contentEl;
    }

    async #loadMarked() {
        if (marked) return marked;
        
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('libs/marked.min.js');
            script.onload = () => {
                marked = window.marked;
                marked.setOptions({
                    breaks: true,
                    gfm: true,
                    headerIds: false,
                    mangle: false
                });
                resolve(marked);
            };
            script.onerror = () => {
                console.error('[Agent13 UI] Failed to load marked.js');
                resolve(null);
            };
            document.head.appendChild(script);
        });
    }

    create() {
        if (this.#panelEl) {
            this.#panelEl.classList.add('agent13-panel-visible');
            this.#state = Panel.STATES.EXPANDED;
            return;
        }

        this.#panelEl = document.createElement('div');
        this.#panelEl.className = 'agent13-panel';
        this.#panelEl.style.zIndex = '999999';
        
        const header = this.#createHeader();
        this.#contentEl = document.createElement('div');
        this.#contentEl.className = 'agent13-panel-content';
        const input = this.#createInput();
        
        // Add resizer element
        const resizer = document.createElement('div');
        resizer.className = 'agent13-panel-resizer';
        
        // Handle resize functionality
        let isResizing = false;
        let startWidth;
        let startX;
        
        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startWidth = this.#panelEl.offsetWidth;
            startX = e.clientX;
            resizer.classList.add('dragging');
            
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
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        
        this.#panelEl.appendChild(header);
        this.#panelEl.appendChild(this.#contentEl);
        this.#panelEl.appendChild(input);
        this.#panelEl.appendChild(resizer);
        
        document.body.appendChild(this.#panelEl);
        this.#state = Panel.STATES.EXPANDED;

        // Force a reflow before adding the visible class
        this.#panelEl.offsetHeight;
        this.#panelEl.classList.add('agent13-panel-visible');
        
        // Load marked.js
        this.#loadMarked();
        
        console.log('[Agent13 UI] Panel created and visible');
    }

    #createHeader() {
        const header = document.createElement('div');
        header.className = 'agent13-panel-header';
        
        const leftGroup = document.createElement('div');
        leftGroup.className = 'agent13-header-left';
        
        const title = document.createElement('span');
        title.textContent = 'AGENT13';
        leftGroup.appendChild(title);
        
        const rightGroup = document.createElement('div');
        rightGroup.className = 'agent13-header-right';
        
        const buttons = [
            { icon: 'settings', onClick: () => this.#core.events.emit('settings:open') },
            { icon: 'history', onClick: () => this.#core.events.emit('history:toggle') },
            { icon: 'share', onClick: () => this.#core.events.emit('share:open') },
            { 
                icon: this.#state === Panel.STATES.EXPANDED ? 'collapse' : 'quotes',
                className: 'agent13-collapse-btn',
                onClick: () => {
                    this.toggle();
                    this.#core.state.toggle('isExpanded');
                }
            }
        ];

        buttons.forEach(({ icon, onClick, className = '' }) => {
            const btn = document.createElement('button');
            btn.className = `agent13-header-btn ${className}`.trim();
            btn.innerHTML = UI.getIconSvg(icon);
            btn.onclick = onClick;
            rightGroup.appendChild(btn);
        });
        
        header.appendChild(leftGroup);
        header.appendChild(rightGroup);
        
        return header;
    }

    #createInput() {
        const container = document.createElement('div');
        container.className = 'agent13-input-container';
        
        const input = document.createElement('textarea');
        input.className = 'agent13-input';
        input.placeholder = 'Message agent13...';
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.#core.events.emit('message:send', input.value);
                input.value = '';
            }
        });
        
        container.appendChild(input);
        return container;
    }

    toggle() {
        if (!this.#panelEl) return;

        const collapseBtn = this.#panelEl.querySelector('.agent13-collapse-btn');
        
        if (this.#state === Panel.STATES.EXPANDED) {
            this.#panelEl.classList.add('agent13-panel-collapsed');
            collapseBtn.innerHTML = UI.getIconSvg('quotes');
            this.#state = Panel.STATES.COLLAPSED;
        } else {
            this.#panelEl.classList.remove('agent13-panel-collapsed');
            collapseBtn.innerHTML = UI.getIconSvg('collapse');
            this.#state = Panel.STATES.EXPANDED;
        }
    }

    async addMessage({ type, text }) {
        if (!this.#contentEl) return;

        const messageEl = document.createElement('div');
        messageEl.className = `agent13-${type}`;

        if (type === 'query') {
            // Show user messages immediately
            messageEl.textContent = text;
        } else if (type === 'loading') {
            // Show loading animation
            messageEl.textContent = 'Agent13 is thinking...';
        } else if (type === 'response') {
            try {
                const markedInstance = await this.#loadMarked();
                if (markedInstance) {
                    // Parse markdown and add typing animation
                    const formattedHtml = markedInstance.parse(text);
                    messageEl.innerHTML = formattedHtml;
                } else {
                    // Fallback to plain text if marked isn't loaded
                    messageEl.textContent = text;
                }
            } catch (error) {
                console.error('[Agent13 UI] Failed to format markdown:', error);
                messageEl.textContent = text;
            }
        } else {
            messageEl.textContent = text;
        }

        this.#contentEl.appendChild(messageEl);
        this.#contentEl.scrollTop = this.#contentEl.scrollHeight;
    }

    destroy() {
        if (this.#panelEl) {
            this.#panelEl.remove();
            this.#panelEl = null;
            this.#contentEl = null;
            this.#state = Panel.STATES.HIDDEN;
        }
    }
}

class Trigger {
    #triggerEl = null;
    #core = null;

    constructor(core) {
        this.#core = core;
    }

    create(text, position) {
        console.log('[Agent13 UI] Creating trigger with position:', position);
        
        if (this.#triggerEl) {
            console.log('[Agent13 UI] Destroying existing trigger before creating new one');
            this.destroy();
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'agent13-trigger-wrapper';
        
        const triggerBtn = document.createElement('div');
        triggerBtn.className = 'agent13-trigger';
        triggerBtn.title = 'Ask agent13 about this text';
        
        triggerBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.destroy();
            
            // Create panel first
            this.#core.ui.Panel.create();
            // Small delay to ensure panel is rendered
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Then emit the trigger click event
            this.#core.events.emit('trigger:click', text);
        };
        
        wrapper.appendChild(triggerBtn);
        this.#positionTrigger(wrapper, position);
        
        document.body.appendChild(wrapper);
        this.#triggerEl = wrapper;
        
        console.log('[Agent13 UI] Trigger created:', {
            wrapper: wrapper.getBoundingClientRect(),
            trigger: triggerBtn.getBoundingClientRect(),
            styles: {
                wrapperDisplay: getComputedStyle(wrapper).display,
                wrapperVisibility: getComputedStyle(wrapper).visibility,
                wrapperOpacity: getComputedStyle(wrapper).opacity,
                triggerDisplay: getComputedStyle(triggerBtn).display,
                triggerVisibility: getComputedStyle(triggerBtn).visibility,
                triggerOpacity: getComputedStyle(triggerBtn).opacity
            }
        });
    }

    #positionTrigger(wrapper, position) {
        wrapper.style.position = 'absolute';
        wrapper.style.zIndex = '999999';
        
        // Position using absolute coordinates
        wrapper.style.transform = 'translate(0, -50%)';
        wrapper.style.left = `${position.x}px`;
        wrapper.style.top = `${position.y}px`;
        
        // Ensure trigger stays within viewport
        const rect = wrapper.getBoundingClientRect();
        const margin = 10;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (rect.right > viewportWidth - margin) {
            wrapper.style.left = `${position.x - rect.width - 5}px`; // Show on left side if no room on right
        }
        if (rect.bottom > viewportHeight - margin) {
            wrapper.style.top = `${position.y - (rect.height / 2)}px`;
        }
        if (rect.left < margin) {
            wrapper.style.left = `${position.x + margin}px`;
        }
        if (rect.top < margin) {
            wrapper.style.top = `${position.y + (rect.height / 2)}px`;
        }
    }

    destroy() {
        if (this.#triggerEl) {
            this.#triggerEl.remove();
            this.#triggerEl = null;
        }
    }
}

export class UI {
    static #icons = {
        settings: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>',
        history: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>',
        share: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>',
        collapse: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>',
        expand: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>',
        quotes: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.5 8H5.5C4.67157 8 4 8.67157 4 9.5V13.5C4 14.3284 4.67157 15 5.5 15H7.5L6.5 18H8.5L9.5 15V9.5C9.5 8.67157 8.82843 8 8 8"/><path d="M19.5 8H15.5C14.6716 8 14 8.67157 14 9.5V13.5C14 14.3284 14.6716 15 15.5 15H17.5L16.5 18H18.5L19.5 15V9.5C19.5 8.67157 18.8284 8 18 8"/></svg>'
    };

    #core = null;
    Panel = null;
    Trigger = null;

    constructor(core) {
        if (!core) throw new Error("Core module required");
        this.#core = core;
        this.Panel = new Panel(core);
        this.Trigger = new Trigger(core);
    }

    static getIconSvg(name) {
        return UI.#icons[name] || '';
    }

    static init(core) {
        return new UI(core);
    }
}
