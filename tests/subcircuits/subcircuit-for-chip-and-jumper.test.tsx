import { test, expect } from "bun:test";
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("subcircuit-id property for chip", async () => {
  const { circuit } = await getTestFixture();
  const { autoroutingServerUrl } = getTestAutoroutingServer();

  circuit.add(
    <board width="30mm" height="30mm">
      <chip name="M1" />
    </board>,
  );

  circuit.render();

  expect(circuit.db.pcb_component.list()[0]).toMatchInlineSnapshot(`
{
  "center": {
    "x": 0,
    "y": 0,
  },
  "height": 3,
  "layer": "top",
  "pcb_component_id": "pcb_component_0",
  "rotation": 0,
  "source_component_id": "source_component_0",
  "subcircuit_id": "subcircuit_source_group_0",
  "type": "pcb_component",
  "width": 2,
}
`);
});

test("subcircuit-id property for jumper", async () => {
  const { circuit } = await getTestFixture();
  const { autoroutingServerUrl } = getTestAutoroutingServer();

  circuit.add(
    <board width="30mm" height="30mm">
      <jumper name="J1" />
    </board>,
  );

  circuit.render();

  expect(circuit.db.pcb_component.list()[0]).toMatchInlineSnapshot(`
{
  "center": {
    "x": 0,
    "y": 0,
  },
  "height": 3,
  "layer": "top",
  "pcb_component_id": "pcb_component_0",
  "rotation": 0,
  "source_component_id": "source_component_0",
  "subcircuit_id": "subcircuit_source_group_0",
  "type": "pcb_component",
  "width": 2,
}
`);
});
