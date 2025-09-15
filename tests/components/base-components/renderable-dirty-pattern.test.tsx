import { test, expect } from "bun:test";
import { Renderable } from "lib/components/base-components/Renderable";

class TestComponent extends Renderable {
  constructor() {
    super({});
  }

  doInitialSourceRender() {
    // Test async effect
    this._queueAsyncEffect("test-async-effect", async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  }

  doInitialSchematicComponentRender() {
    // Test marking dirty
    this._markDirty("SchematicComponentRender");
  }
}

test("dirty pattern and async effects", async () => {
  const component = new TestComponent();

  // Initial state
  expect(component.renderPhaseStates.SourceRender.dirty).toBe(false);
  expect(component.renderPhaseStates.SchematicComponentRender.dirty).toBe(
    false,
  );

  // Run initial render phases
  component.runRenderPhase("SourceRender");

  // Check async effects
  expect(component._hasIncompleteAsyncEffects()).toBe(true);

  // Wait for async effects
  await new Promise((resolve) => setTimeout(resolve, 150));
  expect(component._hasIncompleteAsyncEffects()).toBe(false);

  // Test marking phases dirty
  component.runRenderPhase("SchematicComponentRender");

  // SchematicComponentRender and subsequent phases should be marked dirty
  expect(component.renderPhaseStates.SchematicComponentRender.dirty).toBe(true);
  expect(component.renderPhaseStates.SchematicLayout.dirty).toBe(true);
  expect(component.renderPhaseStates.SchematicTraceRender.dirty).toBe(true);

  // Previous phases should not be dirty
  expect(component.renderPhaseStates.SourceRender.dirty).toBe(false);
});
