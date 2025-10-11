import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Hole component with pill shape", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <hole shape="pill" width="2mm" height="4mm" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()

  const pcbHoles = circuit.db.pcb_hole.list()

  expect(pcbHoles.length).toBe(1)
  // Pill shape is converted to oval in circuit-json (pill is only for plated holes)
  expect(pcbHoles[0].hole_shape).toBe("oval")
  expect((pcbHoles[0] as any).hole_width).toBe(2)
  expect((pcbHoles[0] as any).hole_height).toBe(4)
  expect(pcbHoles[0].x).toBe(0)
  expect(pcbHoles[0].y).toBe(0)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
