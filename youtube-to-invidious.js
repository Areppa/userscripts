// ==UserScript==
// @name         YouTube -> Invidious (non-video links)
// @version      1.2
// @description  Replace youtube.com links with a configurable Invidious instance, but ignore video pages (paths starting with /watch).
// @author       Areppa
// @match        *://*/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/areppa/userscripts/main/youtube-to-invidious.js
// @downloadURL  https://raw.githubusercontent.com/areppa/userscripts/main/youtube-to-invidious.js
// ==/UserScript==

(() => {
  "use strict";

  // CONFIG: set your preferred Invidious host (no protocol)
  const INVIDIOUS_HOST = "inv.nadeko.net";

  const INVIDIOUS_HOSTS = new Set(["inv.nadeko.net"]);

  const YT_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);

  // Don't rewrite links when already on an Invidious instance
  if (INVIDIOUS_HOSTS.has(location.hostname.toLowerCase())) return;

  function isVideoPath(url) {
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
    } catch (e) {
      return null;
    }
  }

  function rewriteAnchor(a) {
    const raw = a.getAttribute && a.getAttribute("href");
    if (!raw) return;
    const converted = convertIfNeeded(raw);
    if (converted) a.setAttribute("href", converted);
  }

  function scan(root = document) {
    const list = root.querySelectorAll ? root.querySelectorAll("a[href]") : [];
    list.forEach(rewriteAnchor);
  }

  scan();

  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "childList") {
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          if (n.matches && n.matches("a[href]")) rewriteAnchor(n);
          scan(n);
        });
      } else if (
        m.type === "attributes" &&
        m.attributeName === "href" &&
        m.target.matches &&
        m.target.matches("a[href]")
      ) {
        rewriteAnchor(m.target);
      }
    }
  });

  mo.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href"],
  });

  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      const raw = a.getAttribute("href");
      const converted = convertIfNeeded(raw);
      if (converted && a.href !== converted) a.href = converted;
    },
    true,
  );
})();
