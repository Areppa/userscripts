// ==UserScript==
// @name         YouTube AI Content Alert
// @version      1.2
// @description  Turns the YouTube site background dark red when the AI badge is present, and removes the adaptive ambient background.
// @author       Areppa
// @match        https://www.youtube.com/*
// @updateURL    https://raw.githubusercontent.com/areppa/userscripts/main/youtube-ai-content-alert.js
// @downloadURL  https://raw.githubusercontent.com/areppa/userscripts/main/youtube-ai-content-alert.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Background color to be used
    const COLOR = '#8B0000';

    const BADGE_SELECTOR = 'badge-shape[aria-label="AI: Content was made with AI"]';
    const CINEMATICS_SELECTOR = '#cinematics, .cinematics, .ytp-cinematics';

    let styleEl = null;

    function applyStyles() {
        if (styleEl) return;
        styleEl = document.createElement('style');
        styleEl.id = 'yt-ai-color-style';
        styleEl.textContent = `
            html, body, ytd-app, #content.ytd-app {
                background-color: ${COLOR} !important;
            }
            ${CINEMATICS_SELECTOR} {
                display: none !important;
                opacity: 0 !important;
                background: none !important;
            }
        `;
        document.head.appendChild(styleEl);
    }

    function removeStyles() {
        if (styleEl) {
            styleEl.remove();
            styleEl = null;
        }
    }

    function checkAI() {
        if (document.querySelector(BADGE_SELECTOR)) {
            applyStyles();
        } else {
            removeStyles();
        }
    }

    const observer = new MutationObserver(checkAI);
    observer.observe(document.body, { childList: true, subtree: true });

    checkAI();
})();
