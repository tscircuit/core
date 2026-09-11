import { expect, test } from "bun:test"
import type { FanoutTracePath } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saved fanout paths support leading and trailing vias", async () => {
  for (const endpoints of ["start", "end", "both"] as const) {
    const { circuit } = getTestFixture()
    const startsWithVia = endpoints !== "end"
    const endsWithVia = endpoints !== "start"
    const middleLayer = startsWithVia ? "bottom" : "top"
    const exitLayer = endsWithVia
      ? middleLayer === "top"
        ? "bottom"
        : "top"
      : middleLayer
    const path = {
      connection: "U1.1",
      route: [
        startsWithVia
          ? {
              route_type: "via",
              x: 0,
              y: 0,
              from_layer: "top",
              to_layer: "bottom",
              via_diameter: 0.6,
              via_hole_diameter: 0.3,
            }
          : { route_type: "wire", x: 0, y: 0, layer: "top", width: 0.2 },
        { route_type: "wire", x: 1, y: 1, layer: middleLayer, width: 0.2 },
        endsWithVia
          ? {
              route_type: "via",
              x: 3,
              y: 1,
              from_layer: middleLayer,
              to_layer: exitLayer,
              via_diameter: 0.6,
              via_hole_diameter: 0.3,
            }
          : { route_type: "wire", x: 3, y: 1, layer: exitLayer, width: 0.2 },
      ],
    } satisfies FanoutTracePath
    circuit.add(
      <board width={20} height={16} autorouter={{ allowViaInPad: true }}>
        <fanout name="saved" pcbTracePaths={[path]}>
          <chip
            name="U1"
            pinLabels={{ pin1: "SIGNAL" }}
            footprint={
              <footprint>
                <smtpad portHints={["1"]} width={1} height={1} shape="rect" />
              </footprint>
            }
          />
        </fanout>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={7}
          pcbY={1}
          layer={exitLayer}
        />
        <trace from="U1.1" to="R1.1" />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(circuit.db.pcb_trace_error.list()).toEqual([])
    const savedTrace = circuit.db.pcb_trace
      .list()
      .find((trace) => trace.pcb_trace_id.startsWith("saved_fanout_"))!
    expect(
      savedTrace.route.filter((point) => point.route_type === "via"),
    ).toMatchObject(path.route.filter((point) => point.route_type === "via"))
    expect(savedTrace.route).toContainEqual(path.route[1])
    expect(savedTrace.route[0]).toMatchObject({ x: 0, y: 0, layer: "top" })
    expect(savedTrace.route.at(-1)).toMatchObject({
      x: 3,
      y: 1,
      layer: exitLayer,
    })
    expect(circuit.db.pcb_breakout_point.list()[0]).toMatchObject({
      x: 3,
      y: 1,
      layer: exitLayer,
    })
    expect(
      circuit.db.pcb_via
        .list()
        .filter((via) => via.pcb_trace_id === savedTrace.pcb_trace_id),
    ).toHaveLength(endpoints === "both" ? 2 : 1)
    await expect(circuit).toMatchPcbSnapshot(
      import.meta.path.replace(".test.tsx", `-${endpoints}.test.tsx`),
    )
  }
})
