import { it, expect } from "bun:test"
import { getTestFixture } from "./get-test-fixture"

it("should be able to snapshot a circuit", async () => {
  const { circuit } = await getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )

  circuit.render()

  const pcb_smtpads = circuit.db.pcb_smtpad.list()
  expect(pcb_smtpads.every((smt) => !Number.isNaN(smt.x))).toBe(true)
  expect(pcb_smtpads.every((smt) => !Number.isNaN(smt.y))).toBe(true)

  await expect(circuit.getSoup()).toMatchPcbSnapshot(import.meta.path)
})
