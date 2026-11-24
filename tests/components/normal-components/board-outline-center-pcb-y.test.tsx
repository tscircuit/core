import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an explicit pcbY preserves one-axis board placement", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      pcbY={-50}
      outline={[
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { x: 40, y: 15 },
        { x: 20, y: 15 },
        { x: 20, y: 30 },
        { x: 0, y: 30 },
      ]}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={6} pcbY={7} />
      <via pcbX={2} pcbY={3} fromLayer="top" toLayer="bottom" />
      <pcbnotetext pcbX={10} pcbY={8} text="Preserve pcb-y placement" />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_board.list()[0]).toMatchObject({
    center: { x: 0, y: -50 },
    width: 40,
    height: 30,
    outline: [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 15 },
      { x: 20, y: 15 },
      { x: 20, y: 30 },
      { x: 0, y: 30 },
    ],
  })
  expect(circuit.db.pcb_component.list()[0].center).toEqual({ x: 6, y: -43 })
  expect(circuit.db.pcb_via.list()[0]).toMatchObject({ x: 2, y: -47 })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
