import { test, expect } from "bun:test";
import { Board, Chip, Footprint, SmtPad } from "lib/index";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("chip footprint determines schematic port arrangement", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              pcbX={0}
              pcbY={0}
              shape="rect"
              width={1}
              height={1}
              portHints={["pin1"]}
            />
          </footprint>
        }
      />
    </board>,
  );
  circuit.render();

  const schematicComponent = circuit.db.schematic_component.list()[0];

  expect(schematicComponent).toBeDefined();

  expect(
    circuit.db.pcb_smtpad.list().every((smtpad) => smtpad.pcb_component_id),
  ).toBeTruthy();
});
