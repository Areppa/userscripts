// ==UserScript==
// @name         Website Blocker
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Blocks websites listed in a remote YAML file by closing the tab
// @author       Areppa
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// ==/UserScript==


(function () {
  const YAML_URL = 'https://raw.githubusercontent.com/areppa/userscripts/main/resources/website_blocklist.yaml';

  function parseSimpleYaml(text) {
    const lines = text.split(/\r?\n/);
    const sites = [];
    let inList = false;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      if (!inList) {
        if (line === 'websites:') { inList = true; }
        continue;
      }
      const m = line.match(/^\-\s*["']?(.+?)["']?\s*$/);
      if (m) sites.push(m[1]);
      else break;
    }
    return sites;
  }

  function closeIfBlocked(list) {
    const host = window.location.hostname;
    for (const pattern of list) {
      if (!pattern) continue;
      const p = pattern.startsWith('*.') ? pattern.slice(2) : pattern;
      if (host === p || host.endsWith('.' + p)) {
        try { window.close(); } catch (e) {}
        try { window.location.replace('about:blank'); } catch (e) {}
        return;
      }
    }
  }

  if (typeof GM_xmlhttpRequest === 'function') {
    GM_xmlhttpRequest({
      method: 'GET',
      url: YAML_URL,
      onload: r => {
        if (r.status >= 200 && r.status < 300) {
          closeIfBlocked(parseSimpleYaml(r.responseText));
        }
      }
    });
  } else if (typeof fetch === 'function') {
    fetch(YAML_URL).then(r => r.ok ? r.text() : '').then(t => {
      if (t) closeIfBlocked(parseSimpleYaml(t));
    }).catch(()=>{});
  }
})();
