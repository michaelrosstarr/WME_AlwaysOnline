// ==UserScript==
// @name        WME Always Visible (BushmanZA Edition)
// @namespace   https://wme.michaelrosstarr.com/
// @version     1.1
// @description Makes your user status always visible in Waze Map Editor.
// @author      https://github.com/michaelrosstarr
// @include 	/^https:\/\/(www|beta)\.waze\.com\/(?!user\/)(.{2,6}\/)?editor.*$/
// @exclude     https://www.waze.com/user/*editor/*
// @exclude     https://www.waze.com/*/user/*editor/*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=waze.com
// @grant       none
// @license MIT
// @downloadURL https://update.greasyfork.org/scripts/523636/WME%20Always%20Visible%20%28BushmanZA%20Edition%29.user.js
// @updateURL https://update.greasyfork.org/scripts/523636/WME%20Always%20Visible%20%28BushmanZA%20Edition%29.meta.js
// ==/UserScript==

const ScriptName = GM_info.script.name;
const ScriptVersion = GM_info.script.version;
let wmeSDK;

const log = (message) => {
    if (typeof message === 'string') {
        console.log('WME_AV: ' + message);
    } else {
        console.log('WME_AV: ', message);
    }
}

window.SDK_INITIALIZED.then(initScript);

function initScript() {
    wmeSDK = getWmeSdk({ scriptId: "wme-av", scriptName: "WME Always Visible" });
    log('Initializing');
    bootstrap();
}

const bootstrap = () => {
    log('Bootstrapping');
    if (wmeSDK.State.isReady) {
        init();
    } else {
        wmeSDK.Events.once({ eventName: 'wme-initialized' }).then(() => init());
    }
};

const init = () => {
    log('Executing init logic');

    const onlineEditorsObserver = new MutationObserver((mutations, observer) => {
        const onlineEditors = document.querySelector('#online-editors');
        if (onlineEditors) {
            log('Online editors found');
            observer.disconnect();
            waitForContentInsideOnlineEditors(onlineEditors);
        }
    });

    onlineEditorsObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });
};

const waitForContentInsideOnlineEditors = (onlineEditors) => {
    const contentObserver = new MutationObserver((mutations, observer) => {
        if (onlineEditors.childElementCount > 0) {
            log('Content loaded inside onlineEditors');
            observer.disconnect();
            handleOnlineEditors(onlineEditors);
        }
    });

    contentObserver.observe(onlineEditors, {
        childList: true,
    });
};

const handleOnlineEditors = (onlineEditors) => {
    const bubbleButton = onlineEditors.querySelector('wz-button');
    if (bubbleButton) {
        bubbleButton.click();
        log('Bubble button clicked');
    } else {
        log('Bubble button not found');
        return;
    }

    const visibilityObserver = new MutationObserver((mutations, observer) => {
        const label = onlineEditors.querySelector('.editor-visibility-label');
        if (label && label.textContent === '(invisible)') {
            log('Editor is invisible, making visible');
            const wzButton = onlineEditors.querySelector('wz-button[disabled="false"][color="clear-icon"][size="md"]');
            console.log(wzButton);
            if (wzButton) {

                const button = wzButton.shadowRoot.querySelector('button');
                log(button);
                if (button) {
                    button.click();
                    log('Visibility button clicked');
                }
            }

            bubbleButton.click();

            observer.disconnect();
        } else if (label && label.textContent === '(visible)') {
            if (document.querySelector('#online-editors').childElementCount > 0) {
                bubbleButton.click();
                observer.disconnect();
            }
        }
    });



    visibilityObserver.observe(onlineEditors, {
        childList: true,
        subtree: true,
    });
};
