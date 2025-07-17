// ==UserScript==
// @name         Website Redirector/Blocker
// @version      0.6
// @description  Redirects or blocks specific websites
// @author       Areppa
// @match        *://*.youtube.com/*
// @match        *://*.reddit.com/*
// @match        *://translate.google.com/*
// @grant        none
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
        if (pathname !== '/watch') {
            const newUrl = url.href.replace(/https?:\/\/(www\.)?youtube\.com/, youtubeRedirectBase);
            window.location.href = newUrl;
        }
    }

    // === Reddit logic ===
    else if (hostname.includes('reddit.com')) {
        // Match Reddit post URL pattern: /r/<subreddit>/comments/<post_id>/
        const isPost = /^\/r\/[^\/]+\/comments\/[^\/]+/.test(pathname);

        if (!isPost) {
            window.close(); // Close the tab if it's not a post
        }
    }

    // === Google Translate to DeepL logic ===
    else if (hostname === 'translate.google.com') {
        // Redirect to DeepL immediately
        window.location.href = deeplBase;
    }
})();
