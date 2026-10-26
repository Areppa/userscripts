// ==UserScript==
// @name         YouTube Tweaks
// @version      1.3
// @description  Redirect YouTube searches and channel pages to Invidious, flag AI-labeled videos, and hide live chat by default.
// @author       Areppa
// @match        *://youtube.com/*
// @match        *://www.youtube.com/*
// @match        *://m.youtube.com/*
// @run-at       document-start
// @grant        none
// @updateURL    https://raw.githubusercontent.com/areppa/userscripts/main/youtube-tweaks.js
// @downloadURL  https://raw.githubusercontent.com/areppa/userscripts/main/youtube-tweaks.js
// ==/UserScript==

(() => {
  "use strict";

  // ── Settings: edit these values to customize the script ───────────
  const CONFIG = {
    // YouTube links and searches will be sent to this Invidious instance.
    invidiousHost: "inv.nadeko.net",

    // Enable or disable individual features.
    rewriteLinks: true,
    redirectSearches: true,
    redirectChannelPages: true,
    showRedirectButton: true,
    highlightAIContent: true,
    hideLiveChat: true,

    // Redirect button.
    buttonText: "Open in Invidious",
    buttonTitle: "Open this YouTube page in Invidious",

    // AI-content highlighting.
    aiBadgeSelector: 'badge-shape[aria-label="AI: Content was made with AI"]',
    aiBackgroundColor: "#8B0000",
    cinematicsSelector: "#cinematics, .cinematics, .ytp-cinematics",

    // Time between attempts to find the live-chat close button, in milliseconds.
    chatPollInterval: 500,
  };
  // ─────────────────────────────────────────────────────────────────

  const BUTTON_ID = "youtube-to-invidious-button";
  const AI_STYLE_ID = "yt-ai-color-style";
  const YOUTUBE_HOSTS = new Set([
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
  ]);

  let chatActive = false;
  let chatTimer = null;

  function isYouTubePage() {
    return YOUTUBE_HOSTS.has(location.hostname.toLowerCase());
  }

  function isEmbedded() {
    try {
      return window.top !== window.self;
    } catch {
      return true;
    }
  }

  function isVideoPage(url) {
    return url.pathname === "/watch";
  }

  function isYouTubeSearch(url) {
    return (
      url.pathname === "/results" &&
      url.searchParams.has("search_query")
    );
  }

  function isYouTubeChannelPage(url) {
    const path = url.pathname;

    return (
      /^\/@[^/]+(?:\/|$)/.test(path) ||
      /^\/(?:channel|c|user)\/[^/]+(?:\/|$)/.test(path) ||
      (path === "/profile" && url.searchParams.has("user"))
    );
  }

  // ── YouTube link and page redirects ───────────────────────────────

  function convertYouTubeUrl(href) {
    try {
      const url = new URL(href, location.href);

      if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;
      if (isVideoPage(url)) return null;

      if (isYouTubeSearch(url)) {
        if (!CONFIG.redirectSearches) return null;

        const invidiousUrl = new URL(
          `https://${CONFIG.invidiousHost}/search`
        );
        invidiousUrl.searchParams.set(
          "q",
          url.searchParams.get("search_query") || ""
        );

        return invidiousUrl.href;
      }

      // Keep channel paths, tabs, query parameters, and fragments intact.
      url.hostname = CONFIG.invidiousHost;
      return url.href;
    } catch {
      return null;
    }
  }

  function redirectSearchPage() {
    if (!CONFIG.redirectSearches || !isYouTubePage()) return false;

    const currentUrl = new URL(location.href);
    if (!isYouTubeSearch(currentUrl)) return false;

    const invidiousUrl = convertYouTubeUrl(currentUrl.href);
    if (!invidiousUrl) return false;

    location.replace(invidiousUrl);
    return true;
  }

  function redirectChannelPage() {
    if (!CONFIG.redirectChannelPages || !isYouTubePage()) return false;

    const currentUrl = new URL(location.href);
    if (!isYouTubeChannelPage(currentUrl)) return false;

    const invidiousUrl = convertYouTubeUrl(currentUrl.href);
    if (!invidiousUrl) return false;

    location.replace(invidiousUrl);
    return true;
  }

  function redirectSpecialPage() {
    return redirectSearchPage() || redirectChannelPage();
  }

  function rewriteAnchor(anchor) {
    const href = anchor.getAttribute("href");
    if (!href) return;

    const convertedUrl = convertYouTubeUrl(href);
    if (convertedUrl) anchor.setAttribute("href", convertedUrl);
  }

  function scanLinks(root = document) {
    if (!root.querySelectorAll) return;

    if (root.matches?.("a[href]")) rewriteAnchor(root);
    root.querySelectorAll("a[href]").forEach(rewriteAnchor);
  }

  // ── Floating redirect button ──────────────────────────────────────

  function createRedirectButton() {
    if (
      !CONFIG.showRedirectButton ||
      isEmbedded() ||
      !isYouTubePage() ||
      isVideoPage(new URL(location.href)) ||
      document.getElementById(BUTTON_ID) ||
      !document.body
    ) {
      return;
    }

    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = CONFIG.buttonText;
    button.title = CONFIG.buttonTitle;

    Object.assign(button.style, {
      position: "fixed",
      right: "16px",
      bottom: "16px",
      zIndex: "2147483647",
      padding: "10px 14px",
      border: "none",
      borderRadius: "6px",
      background: "#ff0000",
      color: "#ffffff",
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      fontWeight: "bold",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
    });

    button.addEventListener("mouseenter", () => {
      button.style.background = "#cc0000";
    });

    button.addEventListener("mouseleave", () => {
      button.style.background = "#ff0000";
    });

    button.addEventListener("click", () => {
      const convertedUrl = convertYouTubeUrl(location.href);
      if (convertedUrl) location.href = convertedUrl;
    });

    document.body.appendChild(button);
  }

  function updateRedirectButton() {
    const shouldShow =
      CONFIG.showRedirectButton &&
      !isEmbedded() &&
      isYouTubePage() &&
      !isVideoPage(new URL(location.href));

    if (shouldShow) {
      createRedirectButton();
    } else {
      document.getElementById(BUTTON_ID)?.remove();
    }
  }

  // ── AI-content highlighting ───────────────────────────────────────

  function applyAIStyles() {
    if (document.getElementById(AI_STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = AI_STYLE_ID;
    style.textContent = `
      html, body, ytd-app, #content.ytd-app {
        background-color: ${CONFIG.aiBackgroundColor} !important;
      }

      ${CONFIG.cinematicsSelector} {
        display: none !important;
        opacity: 0 !important;
        background: none !important;
      }
    `;

    (document.head || document.documentElement)?.appendChild(style);
  }

  function updateAIStyles() {
    if (!CONFIG.highlightAIContent || !isYouTubePage()) {
      document.getElementById(AI_STYLE_ID)?.remove();
      return;
    }

    if (document.querySelector(CONFIG.aiBadgeSelector)) {
      applyAIStyles();
    } else {
      document.getElementById(AI_STYLE_ID)?.remove();
    }
  }

  // ── Hide live chat on video pages ─────────────────────────────────

  function findChatCloseButton() {
    const iframe = document.querySelector("iframe#chatframe");
    if (!iframe) return null;

    try {
      const chatDocument = iframe.contentDocument;
      if (!chatDocument) return null;

      const chatItems = chatDocument.querySelector(
        "yt-live-chat-item-list-renderer #items, " +
          "yt-live-chat-item-list-renderer #empty-state-message"
      );

      if (!chatItems) return null;

      return chatDocument.querySelector(
        "yt-live-chat-header-renderer #close-button button"
      );
    } catch {
      return null;
    }
  }

  function stopHidingChat() {
    chatActive = false;

    if (chatTimer) {
      clearTimeout(chatTimer);
      chatTimer = null;
    }
  }

  function hideChat() {
    if (!chatActive) return;

    const closeButton = findChatCloseButton();

    if (closeButton) {
      closeButton.click();
      stopHidingChat();
      return;
    }

    chatTimer = setTimeout(hideChat, CONFIG.chatPollInterval);
  }

  function startHidingChat() {
    stopHidingChat();

    const isWatchOrClip =
      location.pathname === "/watch" ||
      location.pathname.startsWith("/clip/");

    if (!CONFIG.hideLiveChat || !isYouTubePage() || !isWatchOrClip) return;

    chatActive = true;
    hideChat();
  }

  // ── Page updates and YouTube single-page navigation ────────────────

  function updatePageFeatures() {
    if (CONFIG.rewriteLinks) scanLinks();
    updateRedirectButton();
    updateAIStyles();
  }

  function handleNavigation() {
    setTimeout(() => {
      if (redirectSpecialPage()) return;

      updatePageFeatures();
      startHidingChat();
    }, 100);
  }

  function initialize() {
    const root = document.documentElement;
    if (!root) return;

    const observer = new MutationObserver((mutations) => {
      let pageStructureChanged = false;

      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          pageStructureChanged = true;

          if (CONFIG.rewriteLinks) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) scanLinks(node);
            });
          }
        } else if (
          CONFIG.rewriteLinks &&
          mutation.type === "attributes" &&
          mutation.attributeName === "href" &&
          mutation.target.matches?.("a")
        ) {
          rewriteAnchor(mutation.target);
        }
      }

      if (pageStructureChanged) {
        updateRedirectButton();
        updateAIStyles();
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href"],
    });

    updatePageFeatures();

    if (!isYouTubePage()) return;

    document.addEventListener("yt-navigate-start", stopHidingChat);
    document.addEventListener("yt-navigate-finish", () => {
      if (redirectSpecialPage()) return;

      updatePageFeatures();
      startHidingChat();
    });

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      handleNavigation();
      return result;
    };

    history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      handleNavigation();
      return result;
    };

    window.addEventListener("popstate", handleNavigation);
    document.addEventListener("DOMContentLoaded", startHidingChat);
    startHidingChat();
  }

  // Redirect searches and channel pages immediately on load.
  if (redirectSpecialPage()) return;

  document.addEventListener(
    "click",
    (event) => {
      if (!CONFIG.rewriteLinks) return;

      const anchor = event.target.closest?.("a[href]");
      if (!anchor) return;

      const convertedUrl = convertYouTubeUrl(anchor.getAttribute("href"));
      if (convertedUrl && anchor.href !== convertedUrl) {
        anchor.href = convertedUrl;
      }
    },
    true
  );

  if (document.documentElement) {
    initialize();
  } else {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  }
})();
