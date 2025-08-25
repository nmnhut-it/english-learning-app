import { EventBus } from './EventBus';
import type { ComponentProps } from '@/types';

/**
 * Base Component class for vanilla TypeScript components
 * Provides common functionality for all UI components
 */
export abstract class Component<T extends ComponentProps = ComponentProps> {
  protected element: HTMLElement;
  protected props: T;
  protected eventBus: EventBus;
  protected children: Component[] = [];
  protected isDestroyed = false;

  constructor(props: T) {
    this.props = { ...props };
    this.eventBus = EventBus.getInstance();
    this.element = this.createElement();
    this.setupElement();
    this.bindEvents();
  }

  /**
   * Abstract method to create the DOM element
   * Must be implemented by all subclasses
   */
  protected abstract createElement(): HTMLElement;

  /**
   * Abstract method to bind event listeners
   * Must be implemented by all subclasses
   */
  protected abstract bindEvents(): void;

  /**
   * Setup common element properties
   */
  private setupElement(): void {
    if (this.props.className) {
      this.element.className = this.props.className;
    }
    if (this.props.id) {
      this.element.id = this.props.id;
    }
  }

  /**
   * Render the component to a container
   */
  public render(container: HTMLElement): void {
    if (this.isDestroyed) {
      throw new Error('Cannot render destroyed component');
    }
    container.appendChild(this.element);
  }

  /**
   * Update component props and re-render if needed
   */
  public updateProps(newProps: Partial<T>): void {
    if (this.isDestroyed) return;

    const hasChanges = Object.keys(newProps).some(
      key => this.props[key as keyof T] !== newProps[key as keyof T]
    );

    if (hasChanges) {
      this.props = { ...this.props, ...newProps };
      this.onPropsUpdate();
    }
  }

  /**
   * Called when props are updated
   * Override in subclasses to handle prop changes
   */
  protected onPropsUpdate(): void {
    // Default implementation - can be overridden
  }

  /**
   * Add a child component
   */
  protected addChild(child: Component): void {
    this.children.push(child);
  }

  /**
   * Remove a child component
   */
  protected removeChild(child: Component): void {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
      child.destroy();
    }
  }

  /**
   * Get the DOM element
   */
  public getElement(): HTMLElement {
    return this.element;
  }

  /**
   * Add CSS class to element
   */
  protected addClass(className: string): void {
    this.element.classList.add(className);
  }

  /**
   * Remove CSS class from element
   */
  protected removeClass(className: string): void {
    this.element.classList.remove(className);
  }

  /**
   * Toggle CSS class on element
   */
  protected toggleClass(className: string, force?: boolean): void {
    this.element.classList.toggle(className, force);
  }

  /**
   * Check if element has CSS class
   */
  protected hasClass(className: string): boolean {
    return this.element.classList.contains(className);
  }

  /**
   * Set element attribute
   */
  protected setAttribute(name: string, value: string): void {
    this.element.setAttribute(name, value);
  }

  /**
   * Get element attribute
   */
  protected getAttribute(name: string): string | null {
    return this.element.getAttribute(name);
  }

  /**
   * Remove element attribute
   */
  protected removeAttribute(name: string): void {
    this.element.removeAttribute(name);
  }

  /**
   * Set element text content
   */
  protected setText(text: string): void {
    this.element.textContent = text;
  }

  /**
   * Set element HTML content
   */
  protected setHTML(html: string): void {
    this.element.innerHTML = html;
  }

  /**
   * Add event listener to element
   */
  protected addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void {
    this.element.addEventListener(type, listener, options);
  }

  /**
   * Remove event listener from element
   */
  protected removeEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void {
    this.element.removeEventListener(type, listener, options);
  }

  /**
   * Query selector within component
   */
  protected querySelector<K extends keyof HTMLElementTagNameMap>(
    selector: K
  ): HTMLElementTagNameMap[K] | null;
  protected querySelector<K extends keyof SVGElementTagNameMap>(
    selector: K
  ): SVGElementTagNameMap[K] | null;
  protected querySelector<E extends Element = Element>(selector: string): E | null;
  protected querySelector(selector: string): Element | null {
    return this.element.querySelector(selector);
  }

  /**
   * Query all selectors within component
   */
  protected querySelectorAll<K extends keyof HTMLElementTagNameMap>(
    selector: K
  ): NodeListOf<HTMLElementTagNameMap[K]>;
  protected querySelectorAll<K extends keyof SVGElementTagNameMap>(
    selector: K
  ): NodeListOf<SVGElementTagNameMap[K]>;
  protected querySelectorAll<E extends Element = Element>(
    selector: string
  ): NodeListOf<E>;
  protected querySelectorAll(selector: string): NodeListOf<Element> {
    return this.element.querySelectorAll(selector);
  }

  /**
   * Emit custom event
   */
  protected emit<K extends keyof HTMLElementEventMap>(
    type: K,
    detail?: any,
    options?: CustomEventInit
  ): boolean {
    const event = new CustomEvent(type, { detail, ...options });
    return this.element.dispatchEvent(event);
  }

  /**
   * Show component
   */
  public show(): void {
    this.removeClass('hidden');
    this.setAttribute('aria-hidden', 'false');
  }

  /**
   * Hide component
   */
  public hide(): void {
    this.addClass('hidden');
    this.setAttribute('aria-hidden', 'true');
  }

  /**
   * Toggle component visibility
   */
  public toggle(force?: boolean): void {
    const isHidden = this.hasClass('hidden');
    if (force !== undefined) {
      force ? this.show() : this.hide();
    } else {
      isHidden ? this.show() : this.hide();
    }
  }

  /**
   * Enable component
   */
  public enable(): void {
    this.removeClass('disabled');
    this.removeAttribute('aria-disabled');
    if (this.element instanceof HTMLButtonElement || 
        this.element instanceof HTMLInputElement ||
        this.element instanceof HTMLSelectElement ||
        this.element instanceof HTMLTextAreaElement) {
      this.element.disabled = false;
    }
  }

  /**
   * Disable component
   */
  public disable(): void {
    this.addClass('disabled');
    this.setAttribute('aria-disabled', 'true');
    if (this.element instanceof HTMLButtonElement || 
        this.element instanceof HTMLInputElement ||
        this.element instanceof HTMLSelectElement ||
        this.element instanceof HTMLTextAreaElement) {
      this.element.disabled = true;
    }
  }

  /**
   * Focus component
   */
  public focus(): void {
    if (this.element instanceof HTMLElement) {
      this.element.focus();
    }
  }

  /**
   * Blur component
   */
  public blur(): void {
    if (this.element instanceof HTMLElement) {
      this.element.blur();
    }
  }

  /**
   * Set loading state
   */
  public setLoading(loading: boolean): void {
    this.toggleClass('loading', loading);
    this.setAttribute('aria-busy', loading.toString());
  }

  /**
   * Set error state
   */
  public setError(error: boolean): void {
    this.toggleClass('error', error);
    this.setAttribute('aria-invalid', error.toString());
  }

  /**
   * Animate element using CSS classes
   */
  protected animate(animationClass: string, duration = 300): Promise<void> {
    return new Promise((resolve) => {
      this.addClass(animationClass);
      
      const handleAnimationEnd = () => {
        this.removeClass(animationClass);
        this.removeEventListener('animationend', handleAnimationEnd);
        resolve();
      };

      this.addEventListener('animationend', handleAnimationEnd);
      
      // Fallback timeout
      setTimeout(() => {
        if (this.hasClass(animationClass)) {
          this.removeClass(animationClass);
          resolve();
        }
      }, duration + 100);
    });
  }

  /**
   * Destroy the component and clean up resources
   */
  public destroy(): void {
    if (this.isDestroyed) return;

    // Destroy all child components
    this.children.forEach(child => child.destroy());
    this.children = [];

    // Remove from DOM
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    // Mark as destroyed
    this.isDestroyed = true;

    // Call cleanup hook
    this.onDestroy();
  }

  /**
   * Called when component is destroyed
   * Override in subclasses for custom cleanup
   */
  protected onDestroy(): void {
    // Default implementation - can be overridden
  }

  /**
   * Check if component is destroyed
   */
  public isComponentDestroyed(): boolean {
    return this.isDestroyed;
  }
}