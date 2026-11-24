import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rebuilding the selector index does not multiply matching ports", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={10} routingDisabled schematicDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const board = circuit.firstChild!
  const pin = board.selectOne("R1.pin1", { type: "port" })!
  board.doInitialOptimizeSelectorCache()
  board.doInitialOptimizeSelectorCache()
  expect(board.selectAll("R1.pin1")).toEqual([pin])
  expect(board.selectAll(".R1 > .pin1")).toEqual([pin])
})
