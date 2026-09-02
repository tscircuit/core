import { expect, test } from "bun:test"
import { renderSii9022FanoutBeforeHdmiHpdRouting } from "tests/fixtures/create-sii9022-hdmi-automatic-fanout-phases"

test("SII9022 TMDS fanout blocks subsequent HDMI HPD routing", async () => {
  const circuit = await renderSii9022FanoutBeforeHdmiHpdRouting()
  const hpdSourceTrace = circuit.db.source_trace.getWhere({
    name: "HDMI_HPD_CONNECTOR",
  })!

  expect(
    circuit.db.pcb_trace.getWhere({
      source_trace_id: hpdSourceTrace.source_trace_id,
    }),
  ).toBeUndefined()
  expect(circuit.db.pcb_autorouting_error.list()).not.toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 300_000)
