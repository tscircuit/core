import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("resistor display_value property", () => {
  const { project } = getTestFixture();

  project.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  );

  project.render();

  const resistors = project.db.source_component.list({
    ftype: "simple_resistor",
  }) as Array<{
    ftype: "simple_resistor";
    display_resistance?: string;
  }>;

  expect(resistors).toHaveLength(1);
  expect(resistors[0].display_resistance).toBe("10kΩ");
});
