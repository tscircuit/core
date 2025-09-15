import { test, expect } from "bun:test";
import { getTestFixture } from "../fixtures/get-test-fixture";
import type { PrimitiveComponent } from "../../lib/components/base-components/PrimitiveComponent";

test("selectAll('[_isNormalComponent=true]') selects all normal components", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
      <capacitor name="C1" capacitance="10uF" footprint="0402" />
      <led name="LED1" footprint="0402" />
      <trace from="R1.pin1" to="C1.pin1" />
    </board>,
  );

  circuit.render();

  // Test selectAll("[_isNormalComponent=true]") - selects all normal components
  const normalComponents = circuit.selectAll("[_isNormalComponent=true]");

  // Should contain the normal components we added (but not subcircuits like Board)
  const componentNames = normalComponents.map(
    (comp: PrimitiveComponent) => comp.componentName,
  );
  expect(componentNames).toContain("Resistor");
  expect(componentNames).toContain("Capacitor");
  expect(componentNames).toContain("Led");

  // Should NOT contain the Board since it's a subcircuit, not a normal component that users typically select
  expect(componentNames).not.toContain("Board");

  // Should not contain primitive components like Port, SmtPad, etc
  const hasPrimitives = normalComponents.some(
    (comp: PrimitiveComponent) =>
      comp.componentName === "Port" ||
      comp.componentName === "SmtPad" ||
      comp.componentName === "Trace",
  );
  expect(hasPrimitives).toBe(false);

  // Verify _isNormalComponent property exists on the components
  expect(
    normalComponents.every(
      (comp: PrimitiveComponent) => (comp as any)._isNormalComponent === true,
    ),
  ).toBe(true);

  // Should have found some components
  expect(normalComponents.length).toBeGreaterThan(0);
});

test("selectAll('[_isNormalComponent=true]') caches results correctly", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  );

  circuit.render();

  // First call
  const result1 = circuit.selectAll("[_isNormalComponent=true]");

  // Second call should use cache
  const result2 = circuit.selectAll("[_isNormalComponent=true]");

  expect(result1).toBe(result2); // Should be the exact same array reference due to caching
  expect(result1.length).toBeGreaterThan(0);
});
