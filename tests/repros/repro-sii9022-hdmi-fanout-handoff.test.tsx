import { expect, test } from "bun:test"
import { renderSii9022HdmiFanoutHandoff } from "tests/fixtures/create-sii9022-hdmi-fanout-handoff"

test("repro: SII9022 HDMI fanout handoff disconnects routed copper", async () => {
  const { circuit, autoroutingPhaseIoStack } =
    await renderSii9022HdmiFanoutHandoff()

  const autoroutingErrors = circuit.db.pcb_autorouting_error.list()
  expect(autoroutingErrors).toHaveLength(1)
  expect(autoroutingErrors[0]?.message).toContain(
    'Length matching: bus "TMDS_PAIR_0" has no routed geometry',
  )
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(autoroutingPhaseIoStack).toHaveLength(2)
  expect(autoroutingPhaseIoStack[0]?.endSimpleRouteJson?.traces).toHaveLength(8)
  expect(autoroutingPhaseIoStack[1]?.endSimpleRouteJson).toBeUndefined()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 300_000)
