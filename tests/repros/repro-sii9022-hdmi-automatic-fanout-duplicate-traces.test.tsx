import { expect, test } from "bun:test"
import { renderSii9022HdmiAutomaticFanoutPhases } from "tests/fixtures/create-sii9022-hdmi-automatic-fanout-phases"

test("SII9022 automatic TMDS fanout keeps unique traces before HDMI HPD routing", async () => {
  const { circuit, autoroutingPhaseIoStack } =
    await renderSii9022HdmiAutomaticFanoutPhases()
  const hpdPhaseInput = autoroutingPhaseIoStack.at(-1)?.startSimpleRouteJson
  const preloadedPcbTraceIds =
    hpdPhaseInput?.traces?.map((trace) => trace.pcb_trace_id) ?? []

  expect(new Set(preloadedPcbTraceIds).size).toBe(preloadedPcbTraceIds.length)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(17)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 300_000)
