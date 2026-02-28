import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb calc supports board-relative references for via", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <via
        fromLayer="top"
        toLayer="bottom"
        pcbX="calc(board.minX + 1mm)"
        pcbY="calc(board.maxY - 2mm)"
      />
    </board>,
  )

  circuit.render()

  const via = circuit.db.pcb_via.list()[0]
  expect(via).toBeDefined()
  expect(via?.x).toBeCloseTo(-14)
  expect(via?.y).toBeCloseTo(8)
})
