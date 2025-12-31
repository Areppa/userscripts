// ==UserScript==
// @name         Website Redirector
// @version      0.2.1
// @description  Redirects specific websites
// @author       Areppa
// @match        *://translate.google.com/*
// @match        *://www.youtube.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/areppa/userscripts/main/website-redirector.js
// @downloadURL  https://raw.githubusercontent.com/areppa/userscripts/main/website-redirector.js
// ==/UserScript==

(function () {
    'use strict';

    // ---- Configurable targets ----
    const translateTarget = 'https://www.deepl.com';
    const invidiousInstance = 'https://inv.nadeko.net';

    // Do not run when the page is inside an iframe (i.e., an embed)
    if (window.self !== window.top) return;

    // ---- Helper: preserve path & query when redirecting ----
    const buildUrl = (base, src) => {
        const u = new URL(src);
        return `${base}${u.pathname}${u.search}`;
    };

    // ---- Google Translate → DeepL ----
    if (location.hostname === 'translate.google.com') {
        location.replace(translateTarget);
        return;
    }

    // ---- YouTube → Invidious (skip video pages) ----
    if (location.hostname === 'www.youtube.com' && !location.pathname.includes('/watch')) {
        location.replace(buildUrl(invidiousInstance, location.href));
    }

})();