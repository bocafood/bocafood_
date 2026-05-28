// js/core/router.js
window.Router = (function () {
  'use strict';

  var _routes = {};
  var _current = null;

  function register(route, module) {
    _routes[route] = module;
  }

  function navigate(route) {
    window.location.hash = '#' + route;
  }

  function resolve() {
    if (!Auth.getUser()) {
      if (window.Modules && Modules.Dashboard && typeof Modules.Dashboard.destroyGlobalOnboarding === 'function') {
        Modules.Dashboard.destroyGlobalOnboarding();
      }
      AdminApp.showLogin();
      return;
    }

    AdminApp.showApp();

    var hash = window.location.hash.replace('#', '') || 'dashboard';
    if (window.AdminApp && typeof AdminApp.syncSidebarForRoute === 'function') {
      AdminApp.syncSidebarForRoute(hash);
    }
    var parts = hash.split('/');
    var base = parts[0];
    var sub = parts.slice(1).join('/');

    // Find module - try full route first, then base
    var module = _routes[hash] || _routes[base];

    if (!module) {
      module = _routes['dashboard'];
      base = 'dashboard';
      sub = '';
    }

    // Destroy previous module
    if (_current && _current !== module && typeof _current.destroy === 'function') {
      _current.destroy();
    }

    _current = module;
    _highlightNav(base, hash);

    var app = document.getElementById('app');
    if (app) {
      app.innerHTML = '';
      module.render(sub || '');
    }
    if (window.Modules && Modules.Dashboard && typeof Modules.Dashboard.renderGlobalOnboarding === 'function') {
      window.setTimeout(function () { Modules.Dashboard.renderGlobalOnboarding(); }, 0);
    }
    if (window.AdminApp && typeof AdminApp.checkSeasonGoalCelebration === 'function') {
      window.setTimeout(function () { AdminApp.checkSeasonGoalCelebration(); }, 250);
    }
  }

  function _highlightNav(base, fullRoute) {
    document.querySelectorAll('.nav-item, .nav-sub-item').forEach(function (el) {
      el.classList.remove('active');
    });

    // Highlight exact match first, then the closest parent route for internal subtabs.
    var exact = document.querySelector('[data-route="' + fullRoute + '"]');
    if (!exact) {
      var matches = [].slice.call(document.querySelectorAll('.nav-sub-item[data-route]')).filter(function (el) {
        var route = el.getAttribute('data-route') || '';
        return route && fullRoute.indexOf(route + '/') === 0;
      }).sort(function (a, b) {
        return (b.getAttribute('data-route') || '').length - (a.getAttribute('data-route') || '').length;
      });
      exact = matches[0] || null;
    }
    if (exact) {
      exact.classList.add('active');
      // Also expand parent
      var parent = exact.closest('.nav-group');
      if (parent) {
        parent.classList.add('expanded');
        var parentItem = parent.querySelector('.nav-item');
        if (parentItem) parentItem.classList.add('active');
        var sub = parent.querySelector('.nav-sub');
        if (sub) sub.style.display = 'block';
      }
    } else {
      // Highlight base
      var baseEl = document.querySelector('[data-route="' + base + '"]');
      if (baseEl) baseEl.classList.add('active');
    }
  }

  function current() {
    return window.location.hash.replace('#', '') || 'dashboard';
  }

  // Listen for hash changes
  window.addEventListener('hashchange', function () {
    resolve();
  });

  return { register, navigate, resolve, current };
})();
