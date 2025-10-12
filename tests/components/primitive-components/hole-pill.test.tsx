import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { PcbHolePill } from "circuit-json"

test("Hole component with pill shape", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <hole shape="pill" width="2mm" height="4mm" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()

  const pcbHoles = circuit.db.pcb_hole.list() as PcbHolePill[]

  expect(pcbHoles.length).toBe(1)
  expect(pcbHoles[0].hole_shape).toBe("pill")
  expect(pcbHoles[0].hole_width).toBe(2)
  expect(pcbHoles[0].hole_height).toBe(4)
  expect(pcbHoles[0].x).toBe(0)
  expect(pcbHoles[0].y).toBe(0)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
