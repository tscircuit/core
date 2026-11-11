import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board/Board"
import { PcbTrace } from "lib/components/primitive-components/PcbTrace"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbtrace emits its internal source trace association without changing props", async () => {
  const { circuit } = getTestFixture()
  const board = new Board({ width: 10, height: 10, routingDisabled: true })
  const sourceTrace = circuit.db.source_trace.insert({
    connected_source_port_ids: [],
    connected_source_net_ids: [],
  })
  const props = {
    route: [
      { x: -2, y: 0 },
      { x: 2, y: 0 },
    ],
  }
  const associated = new PcbTrace(props)
  const unassociated = new PcbTrace(props)
  const parsedProps = structuredClone(associated._parsedProps)
  associated.source_trace_id = sourceTrace.source_trace_id
  board.add(associated)
  board.add(unassociated)
  circuit.add(board)
  await circuit.renderUntilSettled()

  expect(
    circuit.db.pcb_trace.get(associated.pcb_trace_id!)?.source_trace_id,
  ).toBe(sourceTrace.source_trace_id)
  expect(
    circuit.db.pcb_trace.get(unassociated.pcb_trace_id!)?.source_trace_id,
  ).toBeUndefined()
  expect(associated._parsedProps).toEqual(parsedProps)
  expect(associated.props).toEqual(props)
  expect(associated._parsedProps).not.toHaveProperty("source_trace_id")
})
