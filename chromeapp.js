chrome.app.runtime.onLaunched.addListener(
    function(launchData) {
        var createdWindow = chrome.app.window.create('index.html', { id: 'main', bounds: { width: 1280, height: 720 } },
            function(win) {
                if (!launchData || !launchData.url)
                    return;
                var lURL = launchData.url;
                var attemptsCounter = 0;
                var loopFunc = function () {
                    var w = win.contentWindow;
                    attemptsCounter = attemptsCounter + 1;
                    try {
                        w.Initialization.setURL(lURL);
                    }catch (ex) {
                        if (attemptsCounter < 10)
                            setTimeout (function() {loopFunc();}, 100);
                    }
                }
                loopFunc();
            }
        );
    }
);