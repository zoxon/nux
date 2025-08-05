import { describe, it, expect } from "vitest";

import * as module from './index'


describe('/index', () => {
  it('should export component class', () => {
    expect(module).toHaveProperty('Component');
  });

  it('should init helper functions', () => {
    expect(module).toHaveProperty('initComponents');
  });

  it('should export helpers', () => {
    expect(module).toHaveProperty('buildComponentReferenceMap');
    expect(module).toHaveProperty('registerComponent');
    expect(module).toHaveProperty('defineComponent');
    expect(module).toHaveProperty('getInstance');
  });
});
