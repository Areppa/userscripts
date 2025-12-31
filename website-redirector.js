// ==UserScript==
// @name         Website Redirector
// @version      0.1.0
// @description  Redirects specific websites
// @author       Areppa
// @match        *://translate.google.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/areppa/userscripts/main/website-redirector.js
// @downloadURL  https://raw.githubusercontent.com/areppa/userscripts/main/website-redirector.js
// ==/UserScript==

(function() {
    'use strict';

    // == Alternative url ==
    const translateAlternative = 'https://www.deepl.com';

    // == General variables ==
    const url = new URL(window.location.href);
    const hostname = url.hostname;
    const pathname = url.pathname;


    // === Google Translate to DeepL logic ===
    if (hostname === 'translate.google.com') {
        // Redirect to DeepL immediately
        window.location.href = deeplBase;
    }

})();
