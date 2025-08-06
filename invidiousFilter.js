// ==UserScript==
// @name         Invidious Filter
// @version      1.1
// @description  Hides videos from specific channels and those with specified keywords in the title
// @author       Areppa
// @match        https://inv.nadeko.net/feed/popular
// @require      https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    const yamlFileUrl = 'https://raw.githubusercontent.com/areppa/userscripts/main/resources/invidious_blocklist.yaml';

    let channelsToHide = [];
    let keywordsToHide = [];

    // Function to fetch and parse the YAML file
    function fetchYAML() {
        GM_xmlhttpRequest({
            method: "GET",
            url: yamlFileUrl,
            onload: function(response) {
                if (response.status === 200) {
                    try {
                        const yamlContent = response.responseText;
                        const data = jsyaml.load(yamlContent);

                        // Assuming the YAML file has the structure:
                        // channelsToHide: [ "Channel1", "Channel2" ]
                        // keywordsToHide: [ "keyword1", "keyword2" ]
                        channelsToHide = data.channelsToHide || [];
                        keywordsToHide = data.keywordsToHide || [];

                        // Run the content hiding functions after fetching data
                        hideContent();
                    } catch (e) {
                        console.error("Error parsing YAML:", e);
                    }
                } else {
                    console.error("Failed to fetch YAML file:", response.status);
                }
            }
        });
    }

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

    // Fetch the YAML data when the script runs
    fetchYAML();
    hideContent();

    // Optional: Observe changes to the feed and re-run the function
    const observer = new MutationObserver(hideContent);
    observer.observe(document.body, { childList: true, subtree: true });
})();
