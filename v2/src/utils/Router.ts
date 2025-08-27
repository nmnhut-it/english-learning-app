/**
 * Simple client-side router for the V2 English Learning App
 */

export type RouteHandler = () => void;

export interface Route {
  path: string;
  handler: RouteHandler;
  title?: string;
}

export class Router {
  private routes: Map<string, Route> = new Map();
  private currentPath: string = '/';
  private notFoundHandler?: RouteHandler;

  constructor() {
    // Listen for browser navigation events
    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname);
    });

    // Intercept link clicks for client-side routing
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="/"]') as HTMLAnchorElement;
      
      if (link && !link.hasAttribute('data-external')) {
        e.preventDefault();
        this.navigate(link.pathname);
      }
    });
  }

  /**
   * Register a route
   */
  public route(path: string, handler: RouteHandler, title?: string): void {
    this.routes.set(path, { path, handler, title });
  }

  /**
   * Set the 404 handler
   */
  public notFound(handler: RouteHandler): void {
    this.notFoundHandler = handler;
  }

  /**
   * Navigate to a path
   */
  public navigate(path: string, replace: boolean = false): void {
    if (path === this.currentPath && !replace) {
      return; // Already on this path
    }

    // Update browser history
    if (replace) {
      window.history.replaceState({ path }, '', path);
    } else {
      window.history.pushState({ path }, '', path);
    }

    this.handleRoute(path);
  }

  /**
   * Handle route change
   */
  private handleRoute(path: string): void {
    this.currentPath = path;

    const route = this.routes.get(path);
    
    if (route) {
      // Update document title if provided
      if (route.title) {
        document.title = `${route.title} - English Learning App`;
      }
      
      // Execute route handler
      route.handler();
    } else if (this.notFoundHandler) {
      this.notFoundHandler();
    } else {
      console.error(`No route handler for path: ${path}`);
    }
  }

  /**
   * Initialize routing with current path
   */
  public init(): void {
    this.handleRoute(window.location.pathname);
  }

  /**
   * Get current path
   */
  public getCurrentPath(): string {
    return this.currentPath;
  }

  /**
   * Check if a path matches current route
   */
  public isActive(path: string): boolean {
    return this.currentPath === path;
  }

  /**
   * Create a navigation link element
   */
  public createLink(href: string, text: string, className?: string): HTMLAnchorElement {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = text;
    if (className) {
      link.className = className;
    }
    if (this.isActive(href)) {
      link.classList.add('active');
    }
    return link;
  }
}

// Export singleton router instance
export const router = new Router();