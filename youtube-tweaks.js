// ==UserScript==
// @name         YouTube Tweaks
// @version      1.0
// @description  Rewrite non-video YouTube links to Invidious, flag AI-labeled videos, and hide live chat by default.
// @author       Areppa
// @match        *://*/*
// @run-at       document-start
// @grant        none
// @updateURL    https://raw.githubusercontent.com/areppa/userscripts/main/youtube-tweaks.js
// @downloadURL  https://raw.githubusercontent.com/areppa/userscripts/main/youtube-tweaks.js
// ==/UserScript==

(() => {
  "use strict";

  const INVIDIOUS_HOST = "inv.nadeko.net";
  const INVIDIOUS_HOSTS = new Set(["inv.nadeko.net"]);
  const YT_HOSTS = new Set([
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
  ]);

  const BUTTON_ID = "youtube-to-invidious-button";
  const AI_STYLE_ID = "yt-ai-color-style";
  const AI_COLOR = "#8B0000";
  const AI_BADGE_SELECTOR =
    'badge-shape[aria-label="AI: Content was made with AI"]';
  const CINEMATICS_SELECTOR = "#cinematics, .cinematics, .ytp-cinematics";

  // Don't rewrite links or add features on an Invidious instance.
  if (INVIDIOUS_HOSTS.has(location.hostname.toLowerCase())) return;

  let chatActive = false;
  let chatTimer = null;

  function isYouTubePage() {
    return YT_HOSTS.has(location.hostname.toLowerCase());
  }

  function isEmbedded() {
    try {
      return window.top !== window.self;
    } catch {
      return true;
    }
  }

  function isVideoPath(url = location) {
    return url.pathname === "/watch";
  }

  // --- YouTube link rewriting ---

  function convertIfNeeded(href) {
    try {
      const url = new URL(href, location.href);

      if (!YT_HOSTS.has(url.hostname.toLowerCase())) return null;
      if (isVideoPath(url)) return null;

      url.hostname = INVIDIOUS_HOST;
      return url.href;
    } catch {
      return null;
    }
  }

  function rewriteAnchor(anchor) {
    const raw = anchor.getAttribute("href");
    if (!raw) return;

    const converted = convertIfNeeded(raw);
    if (converted) anchor.setAttribute("href", converted);
  }

  function scanLinks(root = document) {
    if (!root.querySelectorAll) return;

    if (root.matches?.("a[href]")) rewriteAnchor(root);
    root.querySelectorAll("a[href]").forEach(rewriteAnchor);
  }

  // --- Floating Invidious redirect button ---

  function createRedirectButton() {
    if (
      isEmbedded() ||
      !isYouTubePage() ||
      isVideoPath() ||
      document.getElementById(BUTTON_ID) ||
      !document.body
    ) {
      return;
    }

    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "Open in Invidious";
    button.title = "Open this YouTube page in Invidious";

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
      const converted = convertIfNeeded(location.href);
      if (converted) location.href = converted;
    });

    document.body.appendChild(button);
  }

  function updateRedirectButton() {
    if (!isEmbedded() && isYouTubePage() && !isVideoPath()) {
      createRedirectButton();
    } else {
      document.getElementById(BUTTON_ID)?.remove();
    }
  }

  // --- AI-content page styling ---

  function applyAIStyles() {
    if (document.getElementById(AI_STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = AI_STYLE_ID;
    style.textContent = `
      html, body, ytd-app, #content.ytd-app {
        background-color: ${AI_COLOR} !important;
      }

      ${CINEMATICS_SELECTOR} {
        display: none !important;
        opacity: 0 !important;
        background: none !important;
      }
    `;

    (document.head || document.documentElement)?.appendChild(style);
  }

  function checkAIContent() {
    if (!isYouTubePage()) return;

    if (document.querySelector(AI_BADGE_SELECTOR)) {
      applyAIStyles();
    } else {
      document.getElementById(AI_STYLE_ID)?.remove();
    }
  }

  // --- Hide live chat on video pages ---

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

    chatTimer = setTimeout(hideChat, 500);
  }

  function startHidingChat() {
    stopHidingChat();

    const isWatchOrClip =
      location.pathname === "/watch" ||
      location.pathname.startsWith("/clip/");

    if (!isYouTubePage() || !isWatchOrClip) return;

    chatActive = true;
    hideChat();
  }

  // --- Shared page setup and YouTube single-page navigation ---

  function handlePageChanges() {
    scanLinks();
    updateRedirectButton();
    checkAIContent();
  }

  function initialize() {
    const root = document.documentElement;
    if (!root) return;

    const observer = new MutationObserver((mutations) => {
      let pageStructureChanged = false;

      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          pageStructureChanged = true;

          mutation.addedNodes.forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            scanLinks(node);
          });
        } else if (
          mutation.type === "attributes" &&
          mutation.attributeName === "href" &&
          mutation.target.matches?.("a[href]")
        ) {
          rewriteAnchor(mutation.target);
        }
      }

      if (pageStructureChanged) {
        updateRedirectButton();
        checkAIContent();
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href"],
    });

    handlePageChanges();

    if (isYouTubePage()) {
      document.addEventListener("yt-navigate-start", stopHidingChat);
      document.addEventListener("yt-navigate-finish", () => {
        handlePageChanges();
        startHidingChat();
      });

      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      function handleNavigation() {
        setTimeout(() => {
          handlePageChanges();
          startHidingChat();
        }, 100);
      }

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
  }

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest?.("a[href]");
    if (!anchor) return;

    const converted = convertIfNeeded(anchor.getAttribute("href"));
    if (converted && anchor.href !== converted) {
      anchor.href = converted;
    }
  }, true);

  if (document.documentElement) {
    initialize();
  } else {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  }
})();
