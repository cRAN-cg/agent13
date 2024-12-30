class SettingsManager {
    #apiKeyInput = document.getElementById('apiKey');
    #saveButton = document.getElementById('saveSettings');
    #statusDiv = document.getElementById('status');
    #versionSpan = document.getElementById('version');

    constructor() {
        this.init();
    }

    init = async () => {
        await this.loadSettings();
        this.#saveButton.addEventListener('click', this.saveSettings);
        
        try {
            const response = await fetch(chrome.runtime.getURL('manifest.json'));
            const manifest = await response.json();
            this.#versionSpan.textContent = `v${manifest.version}`;
        } catch (error) {
            console.error('Error loading version:', error);
        }
    }

    loadSettings = async () => {
        try {
            const { anthropicApiKey } = await chrome.storage.local.get('anthropicApiKey');
            if (anthropicApiKey) {
                this.#apiKeyInput.value = anthropicApiKey;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showStatus('Failed to load settings', 'error');
        }
    }

    saveSettings = async () => {
        const apiKey = this.#apiKeyInput.value.trim();
        
        if (!apiKey) {
            this.showStatus('Please enter an API key', 'error');
            return;
        }
        
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'anthropic-version': '2023-06-01',
                    'x-api-key': apiKey,
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'Test' }],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error?.message || 'Invalid API key');
            }

            await chrome.storage.local.set({ anthropicApiKey: apiKey });
            this.showStatus('Settings saved', 'success');
        } catch (error) {
            this.showStatus(error.message, 'error');
        }
    }

    showStatus = (message, type) => {
        this.#statusDiv.textContent = message;
        this.#statusDiv.className = `settings-status ${type}`;
        
        if (type === 'success') {
            setTimeout(() => {
                this.#statusDiv.textContent = '';
                this.#statusDiv.className = 'settings-status';
            }, 2000);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => new SettingsManager());
