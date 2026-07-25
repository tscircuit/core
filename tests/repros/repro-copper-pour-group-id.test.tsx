import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("copper pour records carry the enclosing pcb_group_id", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <group name="G1">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={5}
        />
        <trace from=".R1 > .pin1" to="net.GND" />
        <via
          connectsTo="net.GND"
          holeDiameter="0.3mm"
          outerDiameter="0.6mm"
          fromLayer="top"
          toLayer="bottom"
          pcbX={0}
          pcbY={-8}
        />
        <copperpour connectsTo="net.GND" layer="top" clearance="0.3mm" />
      </group>
    </board>,
  )
  await circuit.renderUntilSettled()

  const pours = circuit.db.pcb_copper_pour.list()
  expect(pours.length).toBeGreaterThan(0)
  const vias = circuit.db.pcb_via.list()

  // The via inside the same group already carries the group id; the copper
  // pour must be grouped consistently with the other PCB primitives.
  const groupId = vias[0]?.pcb_group_id
  expect(groupId).toBeDefined()

  for (const pour of pours) {
    expect(pour.pcb_group_id).toBe(groupId)
  }
})
