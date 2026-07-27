import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import circuitJson from "./assets/power-section.circuit.json"

test("repro161: render the PowerSection Circuit JSON schematic", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<board circuitJson={circuitJson as any} />)
  await circuit.renderUntilSettled()

  const j1 = circuit
    .selectAll("connector")
    .find((connector) => connector.name === "J1")
  expect(j1?.selectAll("port")).toHaveLength(16)

  const j1PcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: j1?.source_component_id,
  })
  expect(j1PcbComponent?.center).toEqual({ x: 0, y: 0 })
  expect(j1PcbComponent?.layer).toBe("top")

  expect(circuitJson).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
