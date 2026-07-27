import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import circuitJson from "./assets/power-section.circuit.json"

test("repro160: render the PowerSection Circuit JSON schematic", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<board circuitJson={circuitJson as any} />)
  await circuit.renderUntilSettled()

  const j1 = circuit
    .selectAll("connector")
    .find((connector) => connector.name === "J1")
  expect(j1?.selectAll("port")).toHaveLength(16)

  expect(circuitJson).toMatchSchematicSnapshot(import.meta.path)
})
