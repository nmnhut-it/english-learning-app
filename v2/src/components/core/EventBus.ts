import type { EventBusEvents, EventCallback } from '@/types';

/**
 * Global Event Bus for component communication
 * Implements singleton pattern for app-wide event handling
 */
export class EventBus {
  private static instance: EventBus;
  private events: Map<string, Set<EventCallback<any>>> = new Map();
  private onceEvents: Map<string, Set<EventCallback<any>>> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event
   */
  public on<K extends keyof EventBusEvents>(
    event: K,
    callback: EventCallback<EventBusEvents[K]>
  ): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }

  /**
   * Subscribe to an event (fires only once)
   */
  public once<K extends keyof EventBusEvents>(
    event: K,
    callback: EventCallback<EventBusEvents[K]>
  ): void {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, new Set());
    }
    this.onceEvents.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from an event
   */
  public off<K extends keyof EventBusEvents>(
    event: K,
    callback: EventCallback<EventBusEvents[K]>
  ): void {
    if (this.events.has(event)) {
      this.events.get(event)!.delete(callback);
    }
    if (this.onceEvents.has(event)) {
      this.onceEvents.get(event)!.delete(callback);
    }
  }

  /**
   * Emit an event to all subscribers
   */
  public emit<K extends keyof EventBusEvents>(
    event: K,
    data: EventBusEvents[K]
  ): void {
    // Handle regular subscribers
    if (this.events.has(event)) {
      const callbacks = Array.from(this.events.get(event)!);
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }

    // Handle once subscribers
    if (this.onceEvents.has(event)) {
      const callbacks = Array.from(this.onceEvents.get(event)!);
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in once event listener for ${event}:`, error);
        }
      });
      // Clear once events after firing
      this.onceEvents.delete(event);
    }
  }

  /**
   * Remove all listeners for an event
   */
  public removeAllListeners<K extends keyof EventBusEvents>(event: K): void {
    this.events.delete(event);
    this.onceEvents.delete(event);
  }

  /**
   * Get count of listeners for an event
   */
  public listenerCount<K extends keyof EventBusEvents>(event: K): number {
    const regularCount = this.events.get(event)?.size || 0;
    const onceCount = this.onceEvents.get(event)?.size || 0;
    return regularCount + onceCount;
  }

  /**
   * Get all event names that have listeners
   */
  public eventNames(): string[] {
    const regularEvents = Array.from(this.events.keys());
    const onceEvents = Array.from(this.onceEvents.keys());
    return [...new Set([...regularEvents, ...onceEvents])];
  }

  /**
   * Clear all event listeners
   */
  public removeAllEvents(): void {
    this.events.clear();
    this.onceEvents.clear();
  }

  /**
   * Check if an event has listeners
   */
  public hasListeners<K extends keyof EventBusEvents>(event: K): boolean {
    return this.listenerCount(event) > 0;
  }

  /**
   * Create a namespaced event emitter
   */
  public createNamespace(namespace: string): NamespacedEventBus {
    return new NamespacedEventBus(this, namespace);
  }

  /**
   * Async event emission with Promise support
   */
  public async emitAsync<K extends keyof EventBusEvents>(
    event: K,
    data: EventBusEvents[K]
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    // Handle regular subscribers
    if (this.events.has(event)) {
      const callbacks = Array.from(this.events.get(event)!);
      callbacks.forEach(callback => {
        promises.push(
          new Promise<void>((resolve) => {
            try {
              const result = callback(data);
              // If callback returns a promise, wait for it
              if (result instanceof Promise) {
                result.then(() => resolve()).catch((error) => {
                  console.error(`Error in async event listener for ${event}:`, error);
                  resolve();
                });
              } else {
                resolve();
              }
            } catch (error) {
              console.error(`Error in async event listener for ${event}:`, error);
              resolve();
            }
          })
        );
      });
    }

    // Handle once subscribers
    if (this.onceEvents.has(event)) {
      const callbacks = Array.from(this.onceEvents.get(event)!);
      callbacks.forEach(callback => {
        promises.push(
          new Promise<void>((resolve) => {
            try {
              const result = callback(data);
              if (result instanceof Promise) {
                result.then(() => resolve()).catch((error) => {
                  console.error(`Error in async once event listener for ${event}:`, error);
                  resolve();
                });
              } else {
                resolve();
              }
            } catch (error) {
              console.error(`Error in async once event listener for ${event}:`, error);
              resolve();
            }
          })
        );
      });
      // Clear once events after firing
      this.onceEvents.delete(event);
    }

    await Promise.all(promises);
  }

  /**
   * Debounced event emission
   */
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  public debounce<K extends keyof EventBusEvents>(
    event: K,
    data: EventBusEvents[K],
    delay: number = 300
  ): void {
    const key = String(event);
    
    // Clear existing timer
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key)!);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.emit(event, data);
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Throttled event emission
   */
  private throttleTimers: Map<string, { timer: NodeJS.Timeout; lastEmit: number }> = new Map();

  public throttle<K extends keyof EventBusEvents>(
    event: K,
    data: EventBusEvents[K],
    delay: number = 100
  ): void {
    const key = String(event);
    const now = Date.now();
    
    if (!this.throttleTimers.has(key)) {
      // First call - emit immediately
      this.emit(event, data);
      this.throttleTimers.set(key, {
        timer: setTimeout(() => {
          this.throttleTimers.delete(key);
        }, delay),
        lastEmit: now
      });
    } else {
      const { lastEmit } = this.throttleTimers.get(key)!;
      const timeSinceLastEmit = now - lastEmit;
      
      if (timeSinceLastEmit >= delay) {
        // Enough time has passed - emit now
        this.emit(event, data);
        this.throttleTimers.set(key, {
          timer: setTimeout(() => {
            this.throttleTimers.delete(key);
          }, delay),
          lastEmit: now
        });
      }
      // Otherwise, ignore the emission
    }
  }
}

/**
 * Namespaced Event Bus for component-specific events
 */
class NamespacedEventBus {
  constructor(
    private eventBus: EventBus,
    private namespace: string
  ) {}

  private getNamespacedEvent<K extends keyof EventBusEvents>(event: K): string {
    return `${this.namespace}:${String(event)}`;
  }

  public on<K extends keyof EventBusEvents>(
    event: K,
    callback: EventCallback<EventBusEvents[K]>
  ): void {
    this.eventBus.on(this.getNamespacedEvent(event) as any, callback);
  }

  public once<K extends keyof EventBusEvents>(
    event: K,
    callback: EventCallback<EventBusEvents[K]>
  ): void {
    this.eventBus.once(this.getNamespacedEvent(event) as any, callback);
  }

  public off<K extends keyof EventBusEvents>(
    event: K,
    callback: EventCallback<EventBusEvents[K]>
  ): void {
    this.eventBus.off(this.getNamespacedEvent(event) as any, callback);
  }

  public emit<K extends keyof EventBusEvents>(
    event: K,
    data: EventBusEvents[K]
  ): void {
    this.eventBus.emit(this.getNamespacedEvent(event) as any, data);
  }

  public removeAllListeners<K extends keyof EventBusEvents>(event: K): void {
    this.eventBus.removeAllListeners(this.getNamespacedEvent(event) as any);
  }
}