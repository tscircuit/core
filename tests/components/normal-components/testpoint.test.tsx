import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("<TestPoint/> component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <testpoint name="T1" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})

it("Testpoint circle pad", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <testpoint name="TP1" padDiameter="1mm" />
    </board>,
  )

  circuit.render()

  const pads = circuit.db.pcb_smtpad.list()
  expect(pads.length).toBe(1)
  expect(pads[0].shape).toBe("circle")

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
it("Testpoint hole pad", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <testpoint
        name="TP2"
        footprintVariant="through_hole"
        padDiameter={2}
        holeDiameter={1}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "testpoint-hole-pad")
})
