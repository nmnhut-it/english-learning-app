import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Component } from '@components/core/Component';
import { EventBus } from '@components/core/EventBus';
import type { ComponentProps } from '@/types';

// Mock concrete component for testing
class TestComponent extends Component<ComponentProps> {
  protected createElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'test-component';
    return element;
  }

  protected bindEvents(): void {
    // Test implementation
    this.addEventListener('click', () => {
      this.setAttribute('data-clicked', 'true');
    });
  }

  protected onPropsUpdate(): void {
    // Update DOM when props change
    if (this.props.className) {
      this.element.className = this.props.className;
    }
    if (this.props.id) {
      this.element.id = this.props.id;
    }
  }

  // Expose protected methods for testing
  public testAddClass(className: string) { this.addClass(className); }
  public testRemoveClass(className: string) { this.removeClass(className); }
  public testToggleClass(className: string, force?: boolean) { this.toggleClass(className, force); }
  public testHasClass(className: string) { return this.hasClass(className); }
  public testSetAttribute(name: string, value: string) { this.setAttribute(name, value); }
  public testGetAttribute(name: string) { return this.getAttribute(name); }
  public testRemoveAttribute(name: string) { this.removeAttribute(name); }
  public testSetText(text: string) { this.setText(text); }
  public testSetHTML(html: string) { this.setHTML(html); }
  public testQuerySelector(selector: string) { return this.querySelector(selector); }
  public testQuerySelectorAll(selector: string) { return this.querySelectorAll(selector); }
  public testAddChild(child: Component) { this.addChild(child); }
  public testRemoveChild(child: Component) { this.removeChild(child); }
  public testAnimate(animationClass: string, duration?: number) { return this.animate(animationClass, duration); }
}

describe('Component Base Class', () => {
  let component: TestComponent;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    component = new TestComponent({
      className: 'custom-class',
      id: 'test-component'
    });
  });

  describe('Initialization', () => {
    it('should create element with correct className and id', () => {
      expect(component.getElement().className).toContain('custom-class');
      expect(component.getElement().id).toBe('test-component');
    });

    it('should bind events during construction', () => {
      const element = component.getElement();
      element.click();
      expect(element.getAttribute('data-clicked')).toBe('true');
    });

    it('should have event bus instance', () => {
      const eventBus = EventBus.getInstance();
      expect(eventBus).toBeDefined();
    });
  });

  describe('Rendering', () => {
    it('should render component to container', () => {
      component.render(container);
      expect(container.contains(component.getElement())).toBe(true);
    });

    it('should throw error when rendering destroyed component', () => {
      component.destroy();
      expect(() => component.render(container)).toThrow('Cannot render destroyed component');
    });
  });

  describe('Props Management', () => {
    it('should update props correctly', () => {
      const initialProps = { className: 'initial' };
      const newComponent = new TestComponent(initialProps);
      
      newComponent.updateProps({ className: 'updated' });
      expect(newComponent.getElement().className).toBe('updated');
    });

    it('should not update if props are the same', () => {
      const onPropsUpdateSpy = vi.spyOn(component, 'onPropsUpdate' as any);
      component.updateProps({ className: 'custom-class' });
      expect(onPropsUpdateSpy).not.toHaveBeenCalled();
    });

    it('should not update props if component is destroyed', () => {
      component.destroy();
      const onPropsUpdateSpy = vi.spyOn(component, 'onPropsUpdate' as any);
      component.updateProps({ className: 'new-class' });
      expect(onPropsUpdateSpy).not.toHaveBeenCalled();
    });
  });

  describe('CSS Class Management', () => {
    it('should add CSS class', () => {
      component.testAddClass('new-class');
      expect(component.testHasClass('new-class')).toBe(true);
    });

    it('should remove CSS class', () => {
      component.testAddClass('temp-class');
      component.testRemoveClass('temp-class');
      expect(component.testHasClass('temp-class')).toBe(false);
    });

    it('should toggle CSS class', () => {
      component.testToggleClass('toggle-class');
      expect(component.testHasClass('toggle-class')).toBe(true);
      
      component.testToggleClass('toggle-class');
      expect(component.testHasClass('toggle-class')).toBe(false);
    });

    it('should force toggle CSS class', () => {
      component.testToggleClass('force-class', true);
      expect(component.testHasClass('force-class')).toBe(true);
      
      component.testToggleClass('force-class', false);
      expect(component.testHasClass('force-class')).toBe(false);
    });
  });

  describe('Attribute Management', () => {
    it('should set and get attribute', () => {
      component.testSetAttribute('data-test', 'value');
      expect(component.testGetAttribute('data-test')).toBe('value');
    });

    it('should remove attribute', () => {
      component.testSetAttribute('data-temp', 'value');
      component.testRemoveAttribute('data-temp');
      expect(component.testGetAttribute('data-temp')).toBeNull();
    });
  });

  describe('Content Management', () => {
    it('should set text content', () => {
      component.testSetText('Hello World');
      expect(component.getElement().textContent).toBe('Hello World');
    });

    it('should set HTML content', () => {
      component.testSetHTML('<span>HTML Content</span>');
      expect(component.getElement().innerHTML).toBe('<span>HTML Content</span>');
    });
  });

  describe('DOM Queries', () => {
    beforeEach(() => {
      component.testSetHTML(`
        <div class="child">Child 1</div>
        <div class="child">Child 2</div>
        <span class="other">Other</span>
      `);
    });

    it('should query single selector', () => {
      const child = component.testQuerySelector('.child');
      expect(child).toBeTruthy();
      expect(child?.textContent).toBe('Child 1');
    });

    it('should query all selectors', () => {
      const children = component.testQuerySelectorAll('.child');
      expect(children.length).toBe(2);
      expect(children[0].textContent).toBe('Child 1');
      expect(children[1].textContent).toBe('Child 2');
    });
  });

  describe('Visibility Control', () => {
    it('should show component', () => {
      component.hide();
      component.show();
      expect(component.testHasClass('hidden')).toBe(false);
      expect(component.testGetAttribute('aria-hidden')).toBe('false');
    });

    it('should hide component', () => {
      component.hide();
      expect(component.testHasClass('hidden')).toBe(true);
      expect(component.testGetAttribute('aria-hidden')).toBe('true');
    });

    it('should toggle visibility', () => {
      component.hide();
      component.toggle();
      expect(component.testHasClass('hidden')).toBe(false);
      
      component.toggle();
      expect(component.testHasClass('hidden')).toBe(true);
    });

    it('should force toggle visibility', () => {
      component.toggle(true);
      expect(component.testHasClass('hidden')).toBe(false);
      
      component.toggle(false);
      expect(component.testHasClass('hidden')).toBe(true);
    });
  });

  describe('Enable/Disable Control', () => {
    it('should enable component', () => {
      component.disable();
      component.enable();
      expect(component.testHasClass('disabled')).toBe(false);
      expect(component.testGetAttribute('aria-disabled')).toBeNull();
    });

    it('should disable component', () => {
      component.disable();
      expect(component.testHasClass('disabled')).toBe(true);
      expect(component.testGetAttribute('aria-disabled')).toBe('true');
    });

    it('should handle form elements', () => {
      const button = new (class extends TestComponent {
        protected createElement(): HTMLElement {
          return document.createElement('button');
        }
      })({});
      
      button.disable();
      expect((button.getElement() as HTMLButtonElement).disabled).toBe(true);
      
      button.enable();
      expect((button.getElement() as HTMLButtonElement).disabled).toBe(false);
    });
  });

  describe('Focus Management', () => {
    it('should focus component', () => {
      component.render(container);
      const focusSpy = vi.spyOn(component.getElement(), 'focus');
      component.focus();
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should blur component', () => {
      component.render(container);
      const blurSpy = vi.spyOn(component.getElement(), 'blur');
      component.blur();
      expect(blurSpy).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should set loading state', () => {
      component.setLoading(true);
      expect(component.testHasClass('loading')).toBe(true);
      expect(component.testGetAttribute('aria-busy')).toBe('true');
      
      component.setLoading(false);
      expect(component.testHasClass('loading')).toBe(false);
      expect(component.testGetAttribute('aria-busy')).toBe('false');
    });

    it('should set error state', () => {
      component.setError(true);
      expect(component.testHasClass('error')).toBe(true);
      expect(component.testGetAttribute('aria-invalid')).toBe('true');
      
      component.setError(false);
      expect(component.testHasClass('error')).toBe(false);
      expect(component.testGetAttribute('aria-invalid')).toBe('false');
    });
  });

  describe('Child Management', () => {
    it('should add and remove child components', () => {
      const child = new TestComponent({});
      
      component.testAddChild(child);
      expect((component as any).children).toContain(child);
      
      component.testRemoveChild(child);
      expect((component as any).children).not.toContain(child);
      expect(child.isComponentDestroyed()).toBe(true);
    });
  });

  describe('Animation', () => {
    it('should animate with CSS class', async () => {
      const animationPromise = component.testAnimate('fade-in', 100);
      
      expect(component.testHasClass('fade-in')).toBe(true);
      
      // Simulate animation end
      component.getElement().dispatchEvent(new AnimationEvent('animationend'));
      
      await animationPromise;
      expect(component.testHasClass('fade-in')).toBe(false);
    });

    it('should handle animation timeout fallback', async () => {
      const animationPromise = component.testAnimate('fade-in', 50);
      
      // Don't dispatch animationend, let timeout handle it
      await animationPromise;
      expect(component.testHasClass('fade-in')).toBe(false);
    });
  });

  describe('Component Lifecycle', () => {
    it('should destroy component and cleanup', () => {
      const child = new TestComponent({});
      component.testAddChild(child);
      component.render(container);
      
      const onDestroySpy = vi.spyOn(component, 'onDestroy' as any);
      
      component.destroy();
      
      expect(component.isComponentDestroyed()).toBe(true);
      expect(child.isComponentDestroyed()).toBe(true);
      expect(container.contains(component.getElement())).toBe(false);
      expect(onDestroySpy).toHaveBeenCalled();
    });

    it('should not destroy twice', () => {
      const onDestroySpy = vi.spyOn(component, 'onDestroy' as any);
      
      component.destroy();
      component.destroy(); // Second call should be ignored
      
      expect(onDestroySpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Handling', () => {
    it('should emit custom events', () => {
      let eventFired = false;
      
      component.getElement().addEventListener('custom-event', () => {
        eventFired = true;
      });
      
      component.getElement().dispatchEvent(new CustomEvent('custom-event'));
      expect(eventFired).toBe(true);
    });
  });
});