// Add a visible indicator that the script is running
const debugElement = document.createElement('div');
debugElement.style.display = 'none';
debugElement.setAttribute('data-agent13-debug', 'true');
document.documentElement.appendChild(debugElement);

(async () => {
    try {
        const extensionUrl = chrome.runtime.getURL('');
        
        const [{ default: App }, { initializeMarked }] = await Promise.all([
            import(extensionUrl + 'modules/app.js'),
            import(extensionUrl + 'modules/markdown.js')
        ]);
        
        // Initialize marked with enhanced formatting
        initializeMarked();
        
        // Initialize the app
        await App.getInstance();
        
        // Verify the app is running by checking UI components
        const selection = window.getSelection();
        if (selection) {
        }
    } catch (error) {
        console.error('[Agent13] Failed to initialize:', error);
        // Add error details to debug element
        debugElement.setAttribute('data-agent13-error', error.message);
    }
})();
