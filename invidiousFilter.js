// ==UserScript==
// @name         Invidious Filter
// @version      1.0
// @description  Hides videos from specific channels and those with specified keywords in the title
// @author       Areppa
// @match        https://inv.nadeko.net/feed/popular
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // List of channels to hide
    const channelsToHide = [
        "Asmongold TV",
        "Be Smart",
        "Daily Dose Of Internet",
        "gameranx",
        "LastWeekTonight",
        "MeatCanyon",
        "Mental Outlaw",
        "MrBeast",
        "penguinz0",
        "PowerfulJRE",
        "Primitive Technology",
        "Scott The Woz",
        "Tom Scott plus",
        "Vox",
        "William Osman",
        "xkcd's What If?",
    ];

    // List of keywords to hide in titles
    const keywordsToHide = [
        "#shorts"

    ];

    // Function to hide videos from specified channels
    function hideChannels() {
        const videoCards = document.querySelectorAll('.pure-u-1');

        videoCards.forEach(videoCard => {
            const channelNameElement = videoCard.querySelector('.channel-name');
            if (channelNameElement) {
                const channelName = channelNameElement.textContent.trim();
                if (channelsToHide.includes(channelName)) {
                    videoCard.style.display = 'none';
                }
            }
        });
    }

    // Function to hide videos with specified keywords in titles
    function hideShorts() {
        const videoCards = document.querySelectorAll('.pure-u-1');

        videoCards.forEach(videoCard => {
            const titleElement = videoCard.querySelector('.video-card-row p');
            if (titleElement) {
                const titleText = titleElement.textContent.trim();
                if (keywordsToHide.some(keyword => titleText.includes(keyword))) {
                    videoCard.style.display = 'none';
                }
            }
        });
    }

    // Run the functions to hide channels and shorts
    function hideContent() {
        hideChannels();
        hideShorts();
    }

    hideContent();

    // Optional: Observe changes to the feed and re-run the function
    const observer = new MutationObserver(hideContent);
    observer.observe(document.body, { childList: true, subtree: true });
})();
