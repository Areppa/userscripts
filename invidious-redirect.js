// ==UserScript==
// @name         Invidious Redirector
// @version      2.0.0
// @description  Redirect video pages to a configurable target (YouTube or another Invidious instance).
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
  const TIMEOUT_MS = 3000; // Timeout if redirect is
  // --------------------------------------------------------------------

    // Only act on the specified source hosts
  if (!SOURCE_HOSTS.includes(location.host)) return;

    // Do not run when the page is inside an iframe (i.e., an embed)
  if (window.self !== window.top) return;

    // Verify we are on a video page (/watch?...v=...)
  const url = new URL(location.href);
  if (!url.pathname.startsWith('/watch')) return;

  const videoId = url.searchParams.get('v');
  if (!videoId) return;
  const targetUrl = `https://${TARGET_HOST}/watch?v=${videoId}`;

  let redirected = false;
  const doRedirect = () => {
    if (!redirected) {
      redirected = true;
      location.replace(targetUrl);
    }
  };

  const findVideo = () => document.querySelector('video');

  const handleVideo = (video) => {
    if (!video || redirected) return;

    if (!video.paused && !video.ended && video.currentTime > 0) {
      return; // already playing — do not redirect
    }

    let timeoutId;
    const onPlaying = () => {
      cleanup();
    };
    const cleanup = () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('play', onPlaying);
      if (timeoutId) clearTimeout(timeoutId);
    };

    // Attempt play() — if it resolves, playback started
    try {
      const p = video.play && video.play();
      if (p && typeof p.then === 'function') {
        p.then(() => cleanup()).catch(() => {
          // play() rejected (autoplay blocked) — rely on events + timeout
        });
      }
    } catch (e) { /* ignore */ }

    video.addEventListener('playing', onPlaying);
    video.addEventListener('play', onPlaying);

    timeoutId = setTimeout(() => {
      cleanup();
      if (video.paused || video.currentTime === 0) doRedirect();
    }, TIMEOUT_MS);
  };

  const v = findVideo();
  if (v) {
    handleVideo(v);
    return;
  }

  const mo = new MutationObserver((mutations, obs) => {
    const vid = findVideo();
    if (vid) {
      obs.disconnect();
      handleVideo(vid);
    }
  });
  mo.observe(document.documentElement || document.body, { childList: true, subtree: true });

  // Fallback: if no video appears within TIMEOUT_MS, redirect
  setTimeout(() => {
    if (!redirected && !findVideo()) doRedirect();
  }, TIMEOUT_MS + 200);
})();
