/**
 * Simple hash-based router for GitHub Pages
 */

const routes = new Map();
let currentRoute = null;

// ====== Pure Functions (testable) ======

/**
 * Match a route pattern against a path
 * @param {string} pattern - Route pattern like '/book/:id/:chapter'
 * @param {string} path - Actual path like '/book/123/ch01'
 * @returns {Object|null} - Params object or null if no match
 */
export function matchRoute(pattern, path) {
  // Convert pattern to regex
  // e.g., '/book/:id/:chapter' -> /^\/book\/([^\/]+)\/([^\/]+)$/
  const paramNames = [];
  const regexPattern = pattern.replace(/:([^\/]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^\\/]+)';
  });

  const regex = new RegExp(`^${regexPattern}$`);
  const match = path.match(regex);

  if (!match) return null;

  const params = {};
  paramNames.forEach((name, index) => {
    params[name] = decodeURIComponent(match[index + 1]);
  });

  return params;
}

/**
 * Extract path from hash
 * @param {string} hash - Hash like '#/book/123'
 * @returns {string} - Path like '/book/123'
 */
export function extractPath(hash) {
  return (hash || '').slice(1) || '/';
}

// ====== Router State ======

export function addRoute(pattern, handler) {
  routes.set(pattern, handler);
}

export function navigate(path) {
  window.location.hash = path;
}

export function getCurrentRoute() {
  return currentRoute;
}

function parseRoute(hash) {
  const path = extractPath(hash);

  for (const [pattern, handler] of routes) {
    const params = matchRoute(pattern, path);
    if (params !== null) {
      return { pattern, handler, params, path };
    }
  }

  return null;
}

function handleRouteChange() {
  const route = parseRoute(window.location.hash);

  if (route) {
    currentRoute = route;
    route.handler(route.params);
  } else {
    // Default to home
    navigate('/');
  }
}

export function initRouter() {
  window.addEventListener('hashchange', handleRouteChange);

  // Handle initial route
  if (!window.location.hash) {
    window.location.hash = '/';
  } else {
    handleRouteChange();
  }
}
