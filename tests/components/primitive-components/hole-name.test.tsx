import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board-level hole name is written onto pcb_hole", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="50mm" routingDisabled>
      <hole pcbX={-15} pcbY={0} diameter="3.2mm" name="H9" />
      <hole pcbX={15} pcbY={0} diameter="3.2mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const holes = circuit.db.pcb_hole.list() as any[]
  const named = holes.find((h) => h.x === -15)
  const unnamed = holes.find((h) => h.x === 15)

  expect(named).toBeDefined()
  expect(unnamed).toBeDefined()
  // holeProps already accepts name, but Hole.ts never wrote it, so exporters
  // had to invent designators (tscircuit/tscircuit#4415).
  expect(named.name).toBe("H9")
  expect(unnamed.name).toBeUndefined()
})
