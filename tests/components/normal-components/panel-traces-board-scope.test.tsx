import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board copper remains board-owned when a panel trace connects to it", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel width={40} height={20} layoutMode="grid" col={2}>
      <board name="B1" width={12} height={10}>
        <resistor name="R1" resistance="1k" footprint="0805" pcbY={-2} />
        <resistor name="R2" resistance="1k" footprint="0805" pcbY={2} />
        <trace
          name="board_link"
          from=".R1 .pin2"
          to=".R2 .pin2"
          pcbStraightLine
        />
      </board>
      <board name="B2" width={10} height={10}>
        <resistor name="R3" resistance="1k" footprint="0805" />
      </board>
      <trace name="panel_link" from=".B1 .R1 .pin2" to=".B2 .R3 .pin1" />
    </panel>,
  )
  await circuit.renderUntilSettled()
  const boardSourceTrace = circuit.db.source_trace
    .list()
    .find((t) => t.name === "board_link")!
  const boardTrace = circuit.db.pcb_trace
    .list()
    .find((t) => t.source_trace_id === boardSourceTrace.source_trace_id)!
  expect(boardTrace.pcb_panel_id).toBeUndefined()
  expect(
    circuit.db.pcb_trace.list().filter((t) => t.pcb_panel_id),
  ).toHaveLength(1)
  expect(
    circuit.getCircuitJson().filter((e) => e.type.endsWith("_error")),
  ).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
