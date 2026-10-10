import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ReturnCurrentBoard } from "tests/fixtures/pcb-return-current-board"

test("PCB experiment contact and trace resolution waits for asynchronous routing", async () => {
  const { circuit } = getTestFixture()
  const routingEvents: string[] = []
  circuit.on("asyncEffect:start", (event) => routingEvents.push(event.phase))
  circuit.add(<ReturnCurrentBoard straightSignal={false} />)
  await circuit.renderUntilSettled()
  expect(routingEvents).toContain("PcbTraceRender")
  const [excitation] = circuit.db.simulation_return_current_excitation.list()
  const trace = circuit.db.pcb_trace.get(excitation.pcb_trace_id)
  expect(trace).toBeDefined()
  expect(trace?.route[0]).toMatchObject({ x: -2, y: 0 })
  expect(trace?.route.at(-1)).toMatchObject({ x: 2, y: 0 })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 20_000)
