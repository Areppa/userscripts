// ==UserScript==
// @name         Invidious Redirector (Simple)
// @version      2.1.0
// @description  Immediately redirect Invidious video pages to a configurable target.
// @author       Areppa
// @match        *://*/*watch?v=*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/areppa/userscripts/main/invidious-redirect.js
// @downloadURL  https://raw.githubusercontent.com/areppa/userscripts/main/invidious-redirect.js
// ==/UserScript==

(() => {
  // -------------------------- CONFIGURATION --------------------------
  const SOURCE_HOSTS = [
    'inv.nadeko.net',
    'invidious.nerdvpn.de',
  ];
  const TARGET_HOST = 'youtube.com';
  // --------------------------------------------------------------------

  if (!SOURCE_HOSTS.includes(location.host)) return;
  if (window.self !== window.top) return; // skip embeds

  const url = new URL(location.href);
  if (!url.pathname.startsWith('/watch')) return;

  const videoId = url.searchParams.get('v');
  if (!videoId) return;

  const targetUrl = `https://${TARGET_HOST}/watch?v=${videoId}`;
  location.replace(targetUrl);
})();
