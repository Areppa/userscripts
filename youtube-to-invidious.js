// ==UserScript==
// @name         YouTube -> Invidious (non-video links)
// @version      1.3
// @description  Replace youtube.com links with a configurable Invidious instance and add a redirect button on non-video YouTube pages.
// @author       Areppa
// @match        *://*/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/areppa/userscripts/main/youtube-to-invidious.js
// @downloadURL  https://raw.githubusercontent.com/areppa/userscripts/main/youtube-to-invidious.js
// ==/UserScript==

(() => {
  "use strict";

  // CONFIG: set your preferred Invidious host, without the protocol
  const INVIDIOUS_HOST = "inv.nadeko.net";

  const INVIDIOUS_HOSTS = new Set([
    "inv.nadeko.net",
  ]);

  const YT_HOSTS = new Set([
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
  ]);

  const BUTTON_ID = "youtube-to-invidious-button";

  // Don't rewrite links or show the button on an Invidious instance
  if (INVIDIOUS_HOSTS.has(location.hostname.toLowerCase())) return;

  function isYouTubePage() {
    return YT_HOSTS.has(location.hostname.toLowerCase());
  }

  function isVideoPath(url = location) {
    return url.pathname.startsWith("/watch");
  }

  function convertIfNeeded(href) {
    try {
      const url = new URL(href, location.href);
      const host = url.hostname.toLowerCase();

      if (!YT_HOSTS.has(host)) return null;
      if (isVideoPath(url)) return null;

      const out = new URL(url.toString());
      out.hostname = INVIDIOUS_HOST;

      return out.href;
    } catch {
      return null;
    }
  }

  function rewriteAnchor(a) {
    const raw = a.getAttribute("href");
    if (!raw) return;

    const converted = convertIfNeeded(raw);
    if (converted) {
      a.setAttribute("href", converted);
    }
  }

  function scan(root = document) {
    const list = root.querySelectorAll
      ? root.querySelectorAll("a[href]")
      : [];

    list.forEach(rewriteAnchor);
  }

  function createRedirectButton() {
    if (!isYouTubePage() || isVideoPath()) return;
    if (document.getElementById(BUTTON_ID)) return;

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
      if (converted) {
        location.href = converted;
      }
    });

    document.body.appendChild(button);
  }

  function removeRedirectButton() {
    document.getElementById(BUTTON_ID)?.remove();
  }

  function updateRedirectButton() {
    if (isYouTubePage() && !isVideoPath()) {
      createRedirectButton();
    } else {
      removeRedirectButton();
    }
  }

  scan();
  updateRedirectButton();

  const mo = new MutationObserver((muts) => {
    let urlMayHaveChanged = false;

    for (const m of muts) {
      if (m.type === "childList") {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          if (node.matches?.("a[href]")) {
            rewriteAnchor(node);
          }

          scan(node);
        });

        urlMayHaveChanged = true;
      } else if (
        m.type === "attributes" &&
        m.attributeName === "href" &&
        m.target.matches?.("a[href]")
      ) {
        rewriteAnchor(m.target);
      }
    }

    if (urlMayHaveChanged) {
      updateRedirectButton();
    }
  });

  mo.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href"],
  });

  // Handle YouTube's single-page navigation.
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  function handleNavigation() {
    setTimeout(() => {
      scan();
      updateRedirectButton();
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

  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest?.("a[href]");
      if (!a) return;

      const raw = a.getAttribute("href");
      const converted = convertIfNeeded(raw);

      if (converted && a.href !== converted) {
        a.href = converted;
      }
    },
    true,
  );
})();
