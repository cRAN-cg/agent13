import { getIconSvg } from './Icons.js';

export class Header {
    #headerEl = null;
    #core = null;
    #onToggle = null;

    constructor(core, onToggle) {
        this.#core = core;
        this.#onToggle = onToggle;
    }

    create(initialState = 'expanded') {
        this.#headerEl = document.createElement('div');
        this.#headerEl.className = 'agent13-panel-header';
        
        const leftGroup = this.#createLeftGroup();
        const rightGroup = this.#createRightGroup(initialState);
        
        this.#headerEl.appendChild(leftGroup);
        this.#headerEl.appendChild(rightGroup);
        
        return this.#headerEl;
    }

    #createLeftGroup() {
        const leftGroup = document.createElement('div');
        leftGroup.className = 'agent13-header-left';
        
        const title = document.createElement('span');
        title.textContent = 'AGENT13';
        leftGroup.appendChild(title);
        
        return leftGroup;
    }

    #createRightGroup(initialState) {
        const rightGroup = document.createElement('div');
        rightGroup.className = 'agent13-header-right';
        
        const buttons = [
            { 
                icon: 'settings', 
                onClick: () => this.#core.events.emit('settings:open')
            },
            { 
                icon: 'history', 
                onClick: () => this.#core.events.emit('history:toggle')
            },
            { 
                icon: 'share', 
                onClick: () => this.#core.events.emit('share:open')
            },
            { 
                icon: initialState === 'expanded' ? 'collapse' : 'quotes',
                className: 'agent13-collapse-btn',
                onClick: () => {
                    this.#onToggle();
                    this.#core.state.toggle('isExpanded');
                }
            }
        ];

        buttons.forEach(({ icon, onClick, className = '' }) => {
            const btn = document.createElement('button');
            btn.className = `agent13-header-btn ${className}`.trim();
            btn.innerHTML = getIconSvg(icon);
            btn.onclick = onClick;
            rightGroup.appendChild(btn);
        });
        
        return rightGroup;
    }

    updateCollapseButton(isExpanded) {
        if (!this.#headerEl) return;
        
        const collapseBtn = this.#headerEl.querySelector('.agent13-collapse-btn');
        if (collapseBtn) {
            collapseBtn.innerHTML = getIconSvg(isExpanded ? 'collapse' : 'quotes');
        }
    }

    destroy() {
        this.#headerEl?.remove();
        this.#headerEl = null;
    }
}
