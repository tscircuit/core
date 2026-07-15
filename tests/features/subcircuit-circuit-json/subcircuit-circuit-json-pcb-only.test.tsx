import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

const getImportedCircuitJson = () =>
  renderToCircuitJson(
    <board width="12mm" height="8mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

test("pcb-only circuit json does not synthesize schematic traces", async () => {
  const renderedCircuitJson = await getImportedCircuitJson()
  const pcbOnlyCircuitJson = renderedCircuitJson.filter(
    (element) => !element.type.startsWith("schematic_"),
  ) as CircuitJson
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <subcircuit circuitJson={pcbOnlyCircuitJson} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
  expect(circuit.db.schematic_trace.list()).toHaveLength(0)
})

test("circuit json with schematic elements preserves schematic traces", async () => {
  const circuitJson = await getImportedCircuitJson()
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <subcircuit circuitJson={circuitJson} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.schematic_trace.list().length).toBeGreaterThan(0)
})
