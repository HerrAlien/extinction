chrome.browserAction.onClicked.addListener(
    function() {
        chrome.windows.create({'url': ['index.html'],'incognito': true, 'type' : 'popup' });
    }
);
