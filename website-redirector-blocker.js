// ==UserScript==
// @name         Website Redirector/Blocker
// @version      0.7.4
// @description  Redirects or blocks specific websites
// @author       Areppa
// @match        *://*.youtube.com/*
// @match        *://*.reddit.com/*
// @match        *://inv.nadeko.net/*
// @match        *://translate.google.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/areppa/userscripts/main/website-redirector-blocker.js
// @downloadURL  https://raw.githubusercontent.com/areppa/userscripts/main/website-redirector-blocker.js
// ==/UserScript==

(function() {
    'use strict';

    // == Alternative url ==
    const youtubeRedirectBase = 'https://inv.nadeko.net';
    const deeplBase = 'https://www.deepl.com';

    const url = new URL(window.location.href);
    const hostname = url.hostname;
    const pathname = url.pathname;

    // === YouTube logic ===
    if (hostname.includes('youtube.com')) {
        if (pathname !== '/watch' && pathname !== '/results') {
            const newUrl = url.href.replace(/https?:\/\/(www\.)?youtube\.com/, youtubeRedirectBase);
            window.location.href = newUrl;
        }
    }

    // === Reddit logic ===
    else if (hostname.includes('reddit.com')) {
        const isSubreddit = /^\/r\/[^\/]+(\/.*)?$/.test(pathname);
        const isPost = /^\/r\/[^\/]+\/comments\/[^\/]+/.test(pathname);
        const isUser = /^\/(u|user)\/[^\/]+(\/.*)?$/.test(pathname);

        // If it's not a subreddit, post, or user page, close the tab
        if (!isSubreddit && !isPost && !isUser) {
            window.close();
        }
    }

    // === Google Translate to DeepL logic ===
    else if (hostname === 'translate.google.com') {
        // Redirect to DeepL immediately
        window.location.href = deeplBase;
    }

    // === Invidious trending to subs
    if (hostname.includes('inv.nadeko.net')) {
        if (pathname == '/feed/trending') {
            window.location.href = youtubeRedirectBase;
        }
        if (pathname == '/feed/popular') {
            window.location.href = youtubeRedirectBase;
        }
    }

})();
