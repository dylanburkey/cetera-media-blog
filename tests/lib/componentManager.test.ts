import { describe, it, expect, beforeEach, vi } from 'vitest';

// Component types
interface ComponentUpdate {
  componentId: string;
  type: 'image' | 'layout' | 'text' | 'gallery';
  changes: Record<string, unknown>;
}

interface ComponentState {
  id: string;
  type: string;
  props: Record<string, unknown>;
  version: number;
}

// Mock ComponentManager for testing
class ComponentManager {
  private components: Map<string, ComponentState> = new Map();
  private history: ComponentUpdate[] = [];
  private maxHistory = 50;

  register(id: string, type: string, props: Record<string, unknown> = {}): void {
    this.components.set(id, { id, type, props, version: 1 });
  }

  update(id: string, changes: Record<string, unknown>): boolean {
    const component = this.components.get(id);
    if (!component) return false;

    const update: ComponentUpdate = {
      componentId: id,
      type: component.type as ComponentUpdate['type'],
      changes
    };

    this.history.push(update);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    component.props = { ...component.props, ...changes };
    component.version++;
    return true;
  }

  get(id: string): ComponentState | undefined {
    return this.components.get(id);
  }

  getHistory(): ComponentUpdate[] {
    return [...this.history];
  }

  undo(): ComponentUpdate | null {
    return this.history.pop() || null;
  }

  clear(): void {
    this.components.clear();
    this.history = [];
  }

  getAll(): ComponentState[] {
    return Array.from(this.components.values());
  }

  remove(id: string): boolean {
    return this.components.delete(id);
  }
}

describe('ComponentManager', () => {
  let manager: ComponentManager;

  beforeEach(() => {
    manager = new ComponentManager();
  });

  describe('register', () => {
    it('should register a new component', () => {
      manager.register('img-1', 'image', { src: '/test.jpg', alt: 'Test' });
      
      const component = manager.get('img-1');
      expect(component).toBeDefined();
      expect(component?.type).toBe('image');
      expect(component?.props.src).toBe('/test.jpg');
    });

    it('should initialize version to 1', () => {
      manager.register('img-1', 'image');
      expect(manager.get('img-1')?.version).toBe(1);
    });

    it('should handle empty props', () => {
      manager.register('layout-1', 'layout');
      expect(manager.get('layout-1')?.props).toEqual({});
    });
  });

  describe('update', () => {
    beforeEach(() => {
      manager.register('img-1', 'image', { src: '/old.jpg', alt: 'Old' });
    });

    it('should update component props', () => {
      manager.update('img-1', { src: '/new.jpg' });
      
      const component = manager.get('img-1');
      expect(component?.props.src).toBe('/new.jpg');
      expect(component?.props.alt).toBe('Old'); // unchanged
    });

    it('should increment version on update', () => {
      manager.update('img-1', { src: '/new.jpg' });
      expect(manager.get('img-1')?.version).toBe(2);
    });

    it('should add update to history', () => {
      manager.update('img-1', { src: '/new.jpg' });
      
      const history = manager.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].componentId).toBe('img-1');
    });

    it('should return false for non-existent component', () => {
      const result = manager.update('non-existent', { src: '/test.jpg' });
      expect(result).toBe(false);
    });

    it('should return true for successful update', () => {
      const result = manager.update('img-1', { src: '/new.jpg' });
      expect(result).toBe(true);
    });
  });

  describe('history management', () => {
    beforeEach(() => {
      manager.register('img-1', 'image', { src: '/test.jpg' });
    });

    it('should track multiple updates', () => {
      manager.update('img-1', { src: '/v1.jpg' });
      manager.update('img-1', { src: '/v2.jpg' });
      manager.update('img-1', { src: '/v3.jpg' });
      
      expect(manager.getHistory()).toHaveLength(3);
    });

    it('should limit history to maxHistory entries', () => {
      for (let i = 0; i < 60; i++) {
        manager.update('img-1', { src: `/v${i}.jpg` });
      }
      
      expect(manager.getHistory()).toHaveLength(50);
    });

    it('should undo last update', () => {
      manager.update('img-1', { src: '/v1.jpg' });
      manager.update('img-1', { src: '/v2.jpg' });
      
      const undone = manager.undo();
      expect(undone?.changes.src).toBe('/v2.jpg');
      expect(manager.getHistory()).toHaveLength(1);
    });

    it('should return null when nothing to undo', () => {
      expect(manager.undo()).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all registered components', () => {
      manager.register('img-1', 'image');
      manager.register('layout-1', 'layout');
      manager.register('text-1', 'text');
      
      const all = manager.getAll();
      expect(all).toHaveLength(3);
    });

    it('should return empty array when no components', () => {
      expect(manager.getAll()).toHaveLength(0);
    });
  });

  describe('remove', () => {
    it('should remove a component', () => {
      manager.register('img-1', 'image');
      expect(manager.remove('img-1')).toBe(true);
      expect(manager.get('img-1')).toBeUndefined();
    });

    it('should return false for non-existent component', () => {
      expect(manager.remove('non-existent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all components and history', () => {
      manager.register('img-1', 'image');
      manager.register('img-2', 'image');
      manager.update('img-1', { src: '/new.jpg' });
      
      manager.clear();
      
      expect(manager.getAll()).toHaveLength(0);
      expect(manager.getHistory()).toHaveLength(0);
    });
  });
});

describe('Component Types', () => {
  let manager: ComponentManager;

  beforeEach(() => {
    manager = new ComponentManager();
  });

  describe('Image Components', () => {
    it('should handle image-specific props', () => {
      manager.register('hero-img', 'image', {
        src: '/hero.jpg',
        alt: 'Hero image',
        width: 1920,
        height: 1080,
        loading: 'lazy'
      });

      const img = manager.get('hero-img');
      expect(img?.props.width).toBe(1920);
      expect(img?.props.loading).toBe('lazy');
    });
  });

  describe('Layout Components', () => {
    it('should handle layout-specific props', () => {
      manager.register('split-layout', 'layout', {
        type: 'split-50-50',
        gap: '2rem',
        align: 'center'
      });

      const layout = manager.get('split-layout');
      expect(layout?.props.type).toBe('split-50-50');
    });
  });

  describe('Gallery Components', () => {
    it('should handle gallery with multiple images', () => {
      manager.register('photo-gallery', 'gallery', {
        images: [
          { src: '/img1.jpg', alt: 'Image 1' },
          { src: '/img2.jpg', alt: 'Image 2' },
          { src: '/img3.jpg', alt: 'Image 3' }
        ],
        columns: 3,
        gap: '1rem'
      });

      const gallery = manager.get('photo-gallery');
      expect((gallery?.props.images as unknown[]).length).toBe(3);
    });
  });
});
