// ==UserScript==
// @name        WME Always Visible (BushmanZA Edition)
// @namespace   https://wme.michaelrosstarr.com/
// @version     1.3
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

/**
 * WME Always Visible - Makes your user status always visible in Waze Map Editor
 */

// Script information
const SCRIPT_INFO = {
    name: GM_info.script.name,
    version: GM_info.script.version,
    debugMode: false // Set to true to enable verbose logging
};

// Global variables
let wmeSDK;

/**
 * Logging utility function
 * @param {any} message - Message to log
 */
const log = (message) => {
    if (!SCRIPT_INFO.debugMode) return;

    const prefix = 'WME_AV: ';
    if (typeof message === 'string') {
        console.log(prefix + message);
    } else {
        console.log(prefix, message);
    }
};

/**
 * Creates a mutation observer with error handling
 * @param {Function} callback - Observer callback function
 * @param {Object} options - Observer options
 * @returns {MutationObserver} - Configured mutation observer
 */
const createObserver = (callback, options = { childList: true, subtree: true }) => {
    try {
        return new MutationObserver(callback);
    } catch (error) {
        console.error('WME_AV: Error creating observer:', error);
        return null;
    }
};

/**
 * Initialize the script once SDK is available
 */
window.SDK_INITIALIZED.then(() => {
    try {
        wmeSDK = getWmeSdk({ scriptId: "wme-av", scriptName: "WME Always Visible" });
        log('Initializing');
        bootstrap();
    } catch (error) {
        console.error('WME_AV: Initialization error:', error);
    }
});

/**
 * Bootstrap the script when WME is ready
 */
const bootstrap = () => {
    log('Bootstrapping');
    if (wmeSDK.State.isReady) {
        init();
    } else {
        wmeSDK.Events.once({ eventName: 'wme-initialized' })
            .then(() => init())
            .catch(error => console.error('WME_AV: Error waiting for WME initialization:', error));
    }
};

/**
 * Main initialization function
 */
const init = () => {
    log('Executing init logic');

    const observer = createObserver((mutations, observer) => {
        const onlineEditors = document.querySelector('#online-editors');
        if (onlineEditors) {
            log('Online editors found');
            observer.disconnect();
            observeOnlineEditors(onlineEditors);
        }
    });

    if (observer) {
        observer.observe(document.body, { childList: true, subtree: true });
    }
};

/**
 * Wait for content to load inside online editors panel
 * @param {Element} onlineEditors - Online editors DOM element
 */
const observeOnlineEditors = (onlineEditors) => {
    const observer = createObserver((mutations, observer) => {
        if (onlineEditors.childElementCount > 0) {
            log('Content loaded inside onlineEditors');
            observer.disconnect();
            makeEditorVisible(onlineEditors);
        }
    });

    if (observer) {
        observer.observe(onlineEditors, { childList: true });
    }
};

/**
 * Handle making the editor visible
 * @param {Element} onlineEditors - Online editors DOM element
 */
const makeEditorVisible = (onlineEditors) => {
    const bubbleButton = onlineEditors.querySelector('wz-button');
    if (!bubbleButton) {
        log('Bubble button not found');
        return;
    }

    // Open the online editors panel
    bubbleButton.click();
    log('Bubble button clicked');

    const observer = createObserver((mutations, observer) => {
        const label = onlineEditors.querySelector('.editor-visibility-label');

        if (label && label.textContent === '(invisible)') {
            log('Editor is invisible, making visible');

            const wzButton = onlineEditors.querySelector('wz-button[disabled="false"][color="clear-icon"][size="md"]');
            if (wzButton) {
                const button = wzButton.shadowRoot.querySelector('button');
                if (button) {
                    button.click();
                    log('Visibility button clicked');
                }
            }

            // Close the panel after making visible
            bubbleButton.click();
            observer.disconnect();
        } else if (label && label.textContent === '(visible)') {
            // Close the panel if already visible
            if (document.querySelector('#online-editors').childElementCount > 0) {
                bubbleButton.click();
                observer.disconnect();
            }
        }
    });

    if (observer) {
        observer.observe(onlineEditors, { childList: true, subtree: true });
    }
};
