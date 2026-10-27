import { expect, test } from "bun:test"
import { getBoardStackupFixture } from "tests/fixtures/get-board-stackup-fixture"

test("boards without a preset do not emit a stackup", async () => {
  const circuit = await getBoardStackupFixture({
    width: 20,
    height: 20,
    layers: 4,
    thickness: "1.6mm",
  })
  expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
})
