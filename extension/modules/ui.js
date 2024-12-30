import { Panel } from './components/Panel.js';
import { Trigger } from './components/Trigger.js';
import { getIconSvg } from './components/Icons.js';

export class UI {
    #core = null;
    Panel = null;
    Trigger = null;

    constructor(core) {
        if (!core) throw new Error("Core module required");
        if (!core.events) throw new Error("Core events system required");
        
        this.#core = core;
        this.Panel = new Panel(core);
        
        this.Trigger = new Trigger(core);
        
    }

    static getIconSvg(name) {
        return getIconSvg(name);
    }

    static init(core) {
        const ui = new UI(core);
        return ui;
    }
}
