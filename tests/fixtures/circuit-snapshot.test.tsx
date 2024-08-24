import { it, expect } from "bun:test"
import { getTestFixture } from "./get-test-fixture"

it("should be able to snapshot a circuit", async () => {
  const { project } = await getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )

  project.render()

  const pcb_smtpads = project.db.pcb_smtpad.list()
  expect(pcb_smtpads.every((smt) => !Number.isNaN(smt.x))).toBe(true)
  expect(pcb_smtpads.every((smt) => !Number.isNaN(smt.y))).toBe(true)

  await expect(project.getSoup()).toMatchPcbSnapshot(import.meta.path)
})
