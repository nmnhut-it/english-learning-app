/**
 * Simple hash-based router for GitHub Pages
 */

const routes = new Map();
let currentRoute = null;

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
  const path = hash.slice(1) || '/';

  for (const [pattern, handler] of routes) {
    const params = matchRoute(pattern, path);
    if (params !== null) {
      return { pattern, handler, params, path };
    }
  }

  return null;
}

function matchRoute(pattern, path) {
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
