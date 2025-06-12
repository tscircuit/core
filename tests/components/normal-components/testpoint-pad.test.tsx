import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { PcbSmtPadCircle, PcbPlatedHoleCircle } from "circuit-json"

test("Testpoint pad", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <testpoint name="TP1" padDiameter="1mm" pcbX={2} pcbY={3} />
    </board>,
  )

  circuit.render()

  const pads = circuit.db.pcb_smtpad.list()
  expect(pads.length).toBe(1)
  expect(pads[0].shape).toBe("circle")
  expect((pads[0] as PcbSmtPadCircle).radius).toBe(0.5)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
