import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("flex geometry uses the final center of an autosized board", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board material="flex" thickness={0.15} schematicDisabled routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={12} pcbY={8} />
      <pcbbend
        x1={10}
        y1={6}
        x2={10}
        y2={10}
        bendAngle={0}
        bendRadius={1}
        bendSide="right"
      />
      <pcbstiffener
        shape="rect"
        pcbX={12}
        pcbY={8}
        width={2}
        height={2}
        layer="bottom"
        material="fr4"
        thickness={0.2}
      />
      <pcbnotetext text="Auto-sized flex" pcbX={12} pcbY={6} fontSize={0.5} />
    </board>,
  )
  await circuit.renderUntilSettled()
  const board = circuit.db.pcb_board.list()[0]
  const bend = circuit.db.pcb_bend.list()[0]
  const stiffener = circuit.db.pcb_stiffener.list()[0]
  expect(board.center.x).not.toBe(0)
  expect(board.center.y).not.toBe(0)
  expect(bend.start.x + board.center.x).toBeCloseTo(10)
  expect(bend.start.y + board.center.y).toBeCloseTo(6)
  expect(bend.end.x + board.center.x).toBeCloseTo(10)
  expect(bend.end.y + board.center.y).toBeCloseTo(10)
  if (stiffener.shape !== "rect")
    throw new Error("Expected rectangular stiffener")
  expect(stiffener.center.x + board.center.x).toBeCloseTo(12)
  expect(stiffener.center.y + board.center.y).toBeCloseTo(8)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
