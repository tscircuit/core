import { expect, spyOn, test } from "bun:test"
import type { Board } from "lib/components/normal-components/Board/Board"
import { cssSelectPrimitiveComponentAdapterWithoutSubcircuits } from "lib/components/base-components/PrimitiveComponent/cssSelectPrimitiveComponentAdapter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a cold typed port lookup shares its ambiguity-check traversal", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={14} routingDisabled schematicDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const board = circuit.firstChild as Board
  board._cachedSelectOneQueries.clear()
  board._cachedSelectAllQueries.clear()
  const findAll = spyOn(
    cssSelectPrimitiveComponentAdapterWithoutSubcircuits,
    "findAll",
  )
  let traversals: number
  try {
    expect(board.selectOne(".R1 > .pin1", { type: "port" })).not.toBeNull()
    traversals = findAll.mock.calls.length
  } finally {
    findAll.mockRestore()
  }
  board.add(
    <pcbnotetext
      text={`Cold port lookup: ${traversals} tree traversals`}
      pcbY={4}
      fontSize={0.8}
    />,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
