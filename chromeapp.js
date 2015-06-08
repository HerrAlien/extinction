chrome.app.runtime.onLaunched.addListener(
    function() {
        var createdWindow = chrome.app.window.create('index.html', { id: 'main', bounds: { width: 1280, height: 720 } });
    }
);