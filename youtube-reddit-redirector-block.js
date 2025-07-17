// ==UserScript==
// @name         YouTube & Reddit Redirector/Blocker
// @version      0.5
// @description  Redirect YouTube non-video pages and close Reddit tabs if not a post.
// @author       Areppa
// @match        *://*.youtube.com/*
// @match        *://*.reddit.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // == Youtube Alternative url ==
    const youtubeRedirectBase = 'https://inv.nadeko.net';

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
})();
