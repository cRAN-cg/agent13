(async () => {
    try {
        // Ensure marked is initialized with our options before app starts
        if (window.marked) {
            window.marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: false,
                mangle: false
            });
        }

        const extensionUrl = chrome.runtime.getURL('');
        const { default: App } = await import(extensionUrl + 'modules/app.js');
        
        // Initialize the app
        await App.getInstance();
    } catch (error) {
        console.error('[Agent13] Failed to initialize:', error);
    }
})();
