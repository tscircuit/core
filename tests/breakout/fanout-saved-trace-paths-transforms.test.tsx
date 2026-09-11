import { expect, test } from "bun:test"
import type { FanoutTracePath } from "lib/index"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saved fanout routes follow placement and preserve physical via layers", async () => {
  for (const layer of ["top", "bottom"] as const) {
    for (const rotation of [0, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      const exitLayer = layer === "top" ? "bottom" : "top"
      const paths: FanoutTracePath[] = [
        {
          connection: "U1.1",
          route: [
            { route_type: "wire", x: 1, y: 0, width: 0.2, layer },
            { route_type: "wire", x: 2, y: 1, width: 0.2, layer },
            {
              route_type: "via",
              x: 2,
              y: 1,
              from_layer: layer,
              to_layer: exitLayer,
              via_diameter: 0.6,
              via_hole_diameter: 0.3,
            },
            { route_type: "wire", x: 2, y: 1, width: 0.2, layer: exitLayer },
            { route_type: "wire", x: 4, y: 1, width: 0.2, layer: exitLayer },
          ],
        },
      ]
      circuit.add(
        <board width={30} height={30}>
          <fanout
            name="saved"
            pcbX={2}
            pcbY={-2}
            pcbRotation={rotation}
            pcbTracePaths={paths}
          >
            <chip
              name="U1"
              pcbX={1}
              layer={layer}
              pinLabels={{ pin1: "SIGNAL" }}
              footprint={
                <footprint>
                  <smtpad
                    portHints={["1"]}
                    width={0.6}
                    height={0.6}
                    shape="rect"
                  />
                </footprint>
              }
            />
          </fanout>
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            layer={exitLayer}
            pcbX={9}
            pcbY={5}
          />
          <trace from="U1.1" to="R1.1" />
        </board>,
      )
      await circuit.renderUntilSettled()
      expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
      expect(circuit.db.pcb_trace_error.list()).toEqual([])
      const saved = circuit.db.pcb_trace
        .list()
        .find((trace) => trace.pcb_trace_id.startsWith("saved_fanout_"))!
      const first = saved.route[0]!
      const port = circuit.db.pcb_port.list()[0]!
      expect(first.route_type).toBe("wire")
      if (first.route_type !== "wire") throw new Error("Expected wire")
      expect(first.x).toBeCloseTo(port.x, 8)
      expect(first.y).toBeCloseTo(port.y, 8)
      expect(first.layer).toBe(layer)
      const exit = circuit.db.pcb_breakout_point.list()[0]!
      expect(saved.route.at(-1)).toMatchObject({
        x: exit.x,
        y: exit.y,
        layer: exitLayer,
      })
      const via = circuit.db.pcb_via
        .list()
        .find((via) => via.pcb_trace_id === saved.pcb_trace_id)!
      expect(via).toMatchObject({
        from_layer: layer,
        to_layer: exitLayer,
        hole_diameter: 0.3,
        outer_diameter: 0.6,
      })
      expect(saved.route).toHaveLength(5)
      await expect(circuit).toMatchPcbSnapshot(
        import.meta.path.replace(".test.tsx", `-${layer}-${rotation}.test.tsx`),
      )
    }
  }
})
