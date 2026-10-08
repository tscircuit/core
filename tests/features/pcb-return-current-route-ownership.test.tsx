import { expect, test } from "bun:test"
import type { PcbReturnCurrentExcitation } from "lib/components/primitive-components/PcbReturnCurrentExcitation"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ReturnCurrentBoard } from "tests/fixtures/pcb-return-current-board"

test("a route at matching signal coordinates must also belong to the selected source connection", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<ReturnCurrentBoard />)
  await circuit.renderUntilSettled()
  const [excitation] = circuit.db.simulation_return_current_excitation.list()
  const signalTrace = circuit.db.pcb_trace.get(excitation.pcb_trace_id)!
  const groundTrace = circuit.db.source_trace
    .list()
    .find((trace) => trace.connected_source_net_ids.length > 0)!
  circuit.db.pcb_trace.update(signalTrace.pcb_trace_id, {
    source_trace_id: groundTrace.source_trace_id,
  })
  const component = circuit.selectOne(
    "pcbreturncurrentexcitation",
  ) as PcbReturnCurrentExcitation
  expect(() => component.updatePcbSimulationRender()).toThrow(
    "exactly one complete routed PCB trace",
  )
  expect(circuit.db.simulation_return_current_excitation.list()).toHaveLength(0)
})
