/*
 * Live GitHub star counts.
 *
 * Every star figure on this page used to be typed into the markup, which means it was
 * correct on the day it was written and quietly wrong afterwards. Each one is now
 * marked with `data-stars-repo` and filled from the API.
 *
 * The typed number stays in the HTML as the fallback. If the request fails the page
 * shows the last figure that was true rather than an empty gap, and it still renders
 * with JavaScript off.
 *
 * Cached in localStorage for an hour. The unauthenticated API allows 60 requests an
 * hour per address and this page asks about three repositories, so without a cache a
 * shared network could exhaust it on page loads alone.
 */
(function () {
  'use strict';

  var TTL_MS = 60 * 60 * 1000;

  function cacheKey(repo) {
    return 'ba.stars.' + repo;
  }

  function readCache(repo) {
    try {
      var raw = localStorage.getItem(cacheKey(repo));
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (typeof parsed.count !== 'number' || typeof parsed.at !== 'number') return null;
      if (Date.now() - parsed.at > TTL_MS) return null;
      return parsed.count;
    } catch (err) {
      return null;
    }
  }

  function writeCache(repo, count) {
    try {
      localStorage.setItem(cacheKey(repo), JSON.stringify({ count: count, at: Date.now() }));
    } catch (err) {
      /* Storage unavailable. Nothing to report. */
    }
  }

  function paint(nodes, count) {
    var text = count.toLocaleString();
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var template = node.getAttribute('data-stars-format') || '{n}\u2605';
      node.textContent = template.replace('{n}', text);
    }
  }

  function load(repo, nodes) {
    var cached = readCache(repo);
    if (cached !== null) paint(nodes, cached);

    fetch('https://api.github.com/repos/' + repo, {
      headers: { Accept: 'application/vnd.github+json' }
    })
      .then(function (response) {
        if (!response.ok) throw new Error('star count unavailable');
        return response.json();
      })
      .then(function (body) {
        var count = body.stargazers_count;
        if (typeof count !== 'number' || !isFinite(count) || count < 0) return;
        writeCache(repo, count);
        paint(nodes, count);
      })
      .catch(function () {
        /* Offline, blocked, or rate limited. The typed fallback stands. */
      });
  }

  function start() {
    var marked = document.querySelectorAll('[data-stars-repo]');
    var byRepo = {};
    for (var i = 0; i < marked.length; i++) {
      var repo = marked[i].getAttribute('data-stars-repo');
      if (!repo) continue;
      if (!byRepo[repo]) byRepo[repo] = [];
      byRepo[repo].push(marked[i]);
    }
    Object.keys(byRepo).forEach(function (repo) {
      load(repo, byRepo[repo]);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
