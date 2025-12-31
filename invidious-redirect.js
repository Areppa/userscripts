// ==UserScript==
// @name         Invidious Redirector
// @version      1.2.0
// @description  Redirect video pages to a configurable target (YouTube or another Invidious instance).
// @author       Areppa
// @match        *://*/*watch?v=*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/areppa/userscripts/main/invidious-redirect.js
// @downloadURL  https://raw.githubusercontent.com/areppa/userscripts/main/invidious-redirect.js
// ==/UserScript==

(() => {
    // -------------------------- CONFIGURATION --------------------------
    const SOURCE_HOST = 'inv.nadeko.net';
    const TARGET_HOST = 'youtube.com';
    // --------------------------------------------------------------------

    // Only act on the specified source host
    if (location.host !== SOURCE_HOST) return;

    // Do not run when the page is inside an iframe (i.e., an embed)
    if (window.self !== window.top) return;

    // Verify we are on a video page (/watch?...v=...)
    const url = new URL(location.href);
    if (!url.pathname.startsWith('/watch')) return;

    const videoId = url.searchParams.get('v');
    if (!videoId) return; // no video ID → nothing to redirect

    // Build the target URL using the same path and query format
    const targetUrl = `https://${TARGET_HOST}/watch?v=${videoId}`;
    location.replace(targetUrl);
})();
