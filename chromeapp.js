chrome.app.runtime.onLaunched.addListener(
    function(launchData) {
        var createdWindow = chrome.app.window.create('index.html', { id: 'main', bounds: { width: 1280, height: 720 } },
        function() {
            if (!launchData || !launchData.url)
                return;
            var lURL = launchData.url;
            var loopFunc = function () {
                try {
                    
                } catch (err) {
                    
                }
            }
        }
        );
    }
);