import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("inflated do-not-place chips do not require a footprint", async () => {
  const subcircuitCircuitJson = await renderToCircuitJson(
    <board width="16mm" height="10mm">
      <chip name="U1" pinLabels={{ pin1: "IN", pin2: "OUT" }} doNotPlace />
    </board>,
  )
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="22mm" height="16mm">
      <subcircuit name="IMPORTED" circuitJson={subcircuitCircuitJson} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_missing_footprint_error.list()).toEqual([])
  expect(
    circuit.db.pcb_component.getWhere({ do_not_place: true }),
  ).toBeDefined()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
