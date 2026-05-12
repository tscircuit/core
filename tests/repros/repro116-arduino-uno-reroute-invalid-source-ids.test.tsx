import { expect, test } from "bun:test"
import {
  expectArduinoUnoRerouteSvgSnapshot,
  renderArduinoUnoRerouteRegion,
} from "./repro116-arduino-uno-reroute-utils"

const rerouteRegion = {
  shape: "rect" as const,
  minX: -16,
  maxX: -6,
  minY: -2,
  maxY: 8,
}

test("repro116: rerouting imported arduino region should not create pcb traces with invalid source_trace_id", async () => {
  const { afterRerouteCircuit, beforeRerouteCircuit } =
    await renderArduinoUnoRerouteRegion({
      label: "INVALID SOURCE ID REPRO",
      rerouteRegion,
    })

  expectArduinoUnoRerouteSvgSnapshot({
    afterRerouteCircuit,
    beforeRerouteCircuit,
    importMetaPath: import.meta.path,
    snapshotName: "repro116-arduino-uno-reroute-invalid-source-ids",
  })

  const tracesWithMissingSourceTrace = afterRerouteCircuit.db.pcb_trace
    .list()
    .filter(
      (trace) =>
        trace.source_trace_id &&
        !afterRerouteCircuit.db.source_trace.get(trace.source_trace_id),
    )
    .map((trace) => ({
      pcb_trace_id: trace.pcb_trace_id,
      source_trace_id: trace.source_trace_id,
    }))

  expect(tracesWithMissingSourceTrace).toHaveLength(15)
}, 80_000)
