(async () => {
    try {
        const extensionUrl = chrome.runtime.getURL('');
        const { default: App } = await import(extensionUrl + 'modules/app.js');
        
        // Initialize the app
        await App.getInstance();
    } catch (error) {
        console.error('[Cline] Failed to initialize:', error);
    }
})();
