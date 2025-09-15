import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

// Validate that a circuit can render without a top level board element

test("render circuit without top level board", () => {
  const { circuit } = getTestFixture();

  circuit.add(<resistor name="R1" resistance="10k" footprint="0402" />);
  circuit.add(<led name="LED1" footprint="0402" />);

  expect(() => circuit.render()).not.toThrow();
  expect(circuit.db.source_component.select(".R1")?.name).toBe("R1");
  expect(circuit.db.source_component.select(".LED1")?.name).toBe("LED1");
});
