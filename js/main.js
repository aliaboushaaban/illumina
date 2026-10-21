(function () {
  'use strict';

  var root = document.documentElement;

  // ---------- Theme ----------
  function storedTheme() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }
  var saved = storedTheme();
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);

  var themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var current = root.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
    });
  }

  // ---------- Mobile nav ----------
  var nav = document.getElementById('site-nav');
  var navToggle = document.querySelector('.nav-toggle');
  function setNav(open) {
    nav.setAttribute('data-open', String(open));
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.textContent = open ? 'Close' : 'Menu';
  }
  navToggle.addEventListener('click', function () {
    setNav(nav.getAttribute('data-open') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setNav(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.getAttribute('data-open') === 'true') { setNav(false); navToggle.focus(); }
  });

  // ---------- Scrollspy ----------
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  // ---------- Dashboard tabs ----------
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });

  // ---------- Sample budget (illustrative data, $ thousands) ----------
  var budget = [
    ['General conditions', 118, 112],
    ['Demolition', 42, 39],
    ['Framing & drywall', 196, 188],
    ['Mechanical (HVAC)', 168, 176],
    ['Plumbing', 94, 92],
    ['Electrical & low voltage', 152, 161],
    ['Doors, frames & hardware', 71, 66],
    ['Finishes', 164, 121],
    ['Specialties & equipment', 58, 22],
    ['Contingency (drawn)', 60, 17]
  ];
  var scaleMax = 200;
  var tbody = document.getElementById('budget-rows');
  if (tbody) {
    tbody.innerHTML = budget.map(function (row) {
      var name = row[0], b = row[1], c = row[2], v = c - b;
      var over = v > 0;
      var vText = (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v);
      return '<tr>' +
        '<td>' + name.replace('&', '&amp;') + '</td>' +
        '<td class="num">' + b + '</td>' +
        '<td class="num">' + c + '</td>' +
        '<td class="num ' + (over ? 'var-pos' : 'var-neg') + '">' + vText + (over ? ' ▲' : '') + '</td>' +
        '<td class="bar-cell"><div class="bbar" title="' + name.replace('&', '&amp;') + ': $' + c + 'K committed of $' + b + 'K budget">' +
          '<span class="c' + (over ? ' over' : '') + '" style="width:' + (c / scaleMax * 100).toFixed(1) + '%"></span>' +
          '<span class="b" style="left:' + (b / scaleMax * 100).toFixed(1) + '%"></span>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  // ---------- Revision clouds for the sample markup ----------
  function cloudPath(x, y, w, h, r) {
    var d = 'M' + x + ' ' + y;
    function edge(x1, y1, x2, y2) {
      var len = Math.hypot(x2 - x1, y2 - y1);
      var n = Math.max(2, Math.round(len / (r * 2)));
      for (var i = 1; i <= n; i++) {
        var px = x1 + (x2 - x1) * i / n, py = y1 + (y2 - y1) * i / n;
        d += ' A' + (len / n / 2).toFixed(2) + ' ' + (len / n / 2).toFixed(2) + ' 0 0 1 ' + px.toFixed(2) + ' ' + py.toFixed(2);
      }
    }
    edge(x, y, x + w, y);
    edge(x + w, y, x + w, y + h);
    edge(x + w, y + h, x, y + h);
    edge(x, y + h, x, y);
    return d + 'Z';
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-cloud]'), function (el) {
    var p = el.getAttribute('data-cloud').split(',').map(Number);
    el.setAttribute('d', cloudPath(p[0], p[1], p[2], p[3], 7));
  });

  var demo = document.getElementById('markup-demo');
  if (demo) {
    var mkButtons = Array.prototype.slice.call(demo.querySelectorAll('button[data-k]'));
    mkButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var k = btn.getAttribute('data-k');
        var active = demo.getAttribute('data-focus') === k;
        if (active) demo.removeAttribute('data-focus');
        else demo.setAttribute('data-focus', k);
        mkButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(!active && b === btn)); });
      });
    });
  }

  // ---------- Case study dialogs ----------
  var lastTrigger = null;
  function openCase(id, trigger) {
    var dlg = document.getElementById(id);
    if (!dlg || typeof dlg.showModal !== 'function') return false;
    lastTrigger = trigger || null;
    if (!dlg.open) dlg.showModal();
    dlg.scrollTop = 0;
    if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    return true;
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-case]'), function (btn) {
    btn.addEventListener('click', function () { openCase(btn.getAttribute('data-case'), btn); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('dialog.case'), function (dlg) {
    dlg.querySelector('[data-close]').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () {
      if (location.hash === '#' + dlg.id) history.replaceState(null, '', '#projects');
      if (lastTrigger) lastTrigger.focus();
      else document.getElementById('projects').scrollIntoView();
      lastTrigger = null;
    });
  });
  function caseFromHash() {
    var id = location.hash.slice(1);
    if (id.indexOf('case-') === 0) openCase(id, document.querySelector('[data-case="' + id + '"]'));
  }
  window.addEventListener('hashchange', caseFromHash);
  caseFromHash();

  // ---------- Copy email ----------
  var toastTimer;
  function toast(msg) {
    var t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      t.setAttribute('role', 'status');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2200);
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
    btn.addEventListener('click', function () {
      var el = document.querySelector(btn.getAttribute('data-copy'));
      var text = el.textContent.trim();
      function selectFallback() {
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        toast('Email selected. Press Ctrl+C or ⌘C to copy.');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast('Email address copied'); }, selectFallback);
      } else {
        selectFallback();
      }
    });
  });
})();
