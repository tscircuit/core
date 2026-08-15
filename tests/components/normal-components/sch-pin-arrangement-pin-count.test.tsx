import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schPinArrangement with leftPinCount/rightPinCount creates schematic ports (#2871)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="soic8"
        schPinArrangement={{ leftPinCount: 4, rightPinCount: 4 }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourcePorts = circuit.db.source_port.list()
  expect(sourcePorts.length).toBe(8)

  const schematicPorts = circuit.db.schematic_port.list()
  expect(schematicPorts.length).toBe(8)
})
