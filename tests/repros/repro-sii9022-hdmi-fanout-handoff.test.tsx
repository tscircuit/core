import { expect, test } from "bun:test"
import { renderSii9022HdmiFanoutHandoff } from "tests/fixtures/create-sii9022-hdmi-fanout-handoff"

test("SII9022 HDMI fanout handoff routes all TMDS connections", async () => {
  const { circuit, autoroutingPhaseIoStack } =
    await renderSii9022HdmiFanoutHandoff()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(24)
  expect(autoroutingPhaseIoStack).toHaveLength(2)
  expect(autoroutingPhaseIoStack[0]?.endSimpleRouteJson?.traces).toHaveLength(8)
  expect(
    autoroutingPhaseIoStack[1]?.startSimpleRouteJson?.buses?.map(
      (bus) => bus.connectionNames.length,
    ),
  ).toEqual([2, 2, 2, 2])
  expect(autoroutingPhaseIoStack[1]?.endSimpleRouteJson?.traces).toHaveLength(
    24,
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 300_000)
