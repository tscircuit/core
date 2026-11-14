import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Regresses core#4660 using the full eight-net BGA256 example, rather than
// only a two-port minimal reproduction. Copper pours must not create duplicate
// plane-terminated source connections or silently drop any dogbone escapes.
const connections = {
  pin1: "net.DATA0",
  pin6: "net.DATA1",
  pin8: "net.VCC",
  pin15: "net.GND",
  pin22: "net.CLOCK",
  pin29: "net.ENABLE",
  pin31: "net.DATA2",
  pin36: "net.DATA3",
}

const pourModes = ["none", "ground", "power", "both"] as const
const routingLayers = ["inner2", "bottom"] as const

for (const routingLayer of routingLayers) {
  for (const pourMode of pourModes) {
    test(`dogbone keeps eight BGA256 escapes: target=${routingLayer}, pours=${pourMode}`, async () => {
      const { circuit } = getTestFixture()
      circuit.schematicDisabled = true
      circuit.add(
        <board
          width={20}
          height={20}
          layers={6}
          routeRemaining={false}
          minTraceWidth={0.1}
          minViaPadDiameter={0.4}
          minViaHoleDiameter={0.15}
        >
          {(pourMode === "ground" || pourMode === "both") && (
            <copperpour layer="inner1" connectsTo="net.GND" />
          )}
          {(pourMode === "power" || pourMode === "both") && (
            <copperpour layer="inner3" connectsTo="net.VCC" />
          )}
          <fanout autorouter="dogbone" fanoutRoutingLayers={[routingLayer]}>
            <chip
              name="U1"
              footprint="bga256_grid16x16_p0.8mm_pad0.36mm_blorigin_pinnumbering(columnmajor)"
              connections={connections}
            />
          </fanout>
        </board>,
      )
      await circuit.renderUntilSettled()

      expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
      expect(
        circuit.getCircuitJson().filter((e) => e.type.endsWith("_error")),
      ).toEqual([])
      const vias = circuit.db.pcb_via.list()
      const traces = circuit.db.pcb_trace.list()
      expect(vias).toHaveLength(8)
      expect(traces).toHaveLength(8)
      // A missing or extra net could accidentally preserve just the total.
      expect(new Set(traces.map((trace) => trace.source_trace_id)).size).toBe(8)
      expect(new Set(vias.map((via) => via.pcb_trace_id)).size).toBe(8)
      const traceIds = new Set(traces.map((trace) => trace.pcb_trace_id))
      for (const via of vias) {
        expect(traceIds.has(via.pcb_trace_id!)).toBe(true)
        expect(via.from_layer).toBe("top")
        expect(via.to_layer).toBe(routingLayer)
      }
      for (const trace of traces) {
        expect(trace.route.some((point) => point.route_type === "wire")).toBe(
          true,
        )
        expect(trace.route.some((point) => point.route_type === "via")).toBe(
          true,
        )
      }
    })
  }
}
