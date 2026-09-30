import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("dogbone handoffs follow emitted pads on both sides at each right angle", async () => {
  for (const layer of ["top", "bottom"] as const) {
    for (const rotation of [0, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      circuit.add(
        <board
          width={12}
          height={12}
          layers={4}
          routeRemaining={false}
          minTraceWidth={0.1}
          minViaPadDiameter={0.3}
          minViaHoleDiameter={0.15}
        >
          <fanout autorouter="dogbone" fanoutRoutingLayers={["inner2"]}>
            <chip
              name="U1"
              pcbX={1}
              pcbY={-1}
              pcbRotation={rotation}
              layer={layer}
              connections={{
                pin1: "net.A",
                pin2: "net.B",
                pin3: "net.C",
                pin4: "net.D",
              }}
              footprint={
                <footprint>
                  <smtpad
                    portHints={["1"]}
                    pcbX={0}
                    pcbY={0}
                    shape="circle"
                    radius={0.2}
                  />
                  <smtpad
                    portHints={["2"]}
                    pcbX={0.8}
                    pcbY={0}
                    shape="circle"
                    radius={0.2}
                  />
                  <smtpad
                    portHints={["3"]}
                    pcbX={0}
                    pcbY={0.8}
                    shape="circle"
                    radius={0.2}
                  />
                  <smtpad
                    portHints={["4"]}
                    pcbX={0.8}
                    pcbY={0.8}
                    shape="circle"
                    radius={0.2}
                  />
                </footprint>
              }
            />
          </fanout>
          <pcbnotetext
            pcbY={4}
            text={`Dogbones: ${layer}, ${rotation} degrees to inner2`}
            fontSize={0.35}
          />
        </board>,
      )
      await circuit.renderUntilSettled()
      expect(
        circuit
          .getCircuitJson()
          .filter((element) => element.type.endsWith("_error")),
      ).toEqual([])
      expect(circuit.db.pcb_trace.list()).toHaveLength(4)
      for (const port of circuit.db.pcb_port.list()) {
        const trace = circuit.db.pcb_trace.list().find((trace) => {
          const start = trace.route[0]!
          return (
            start.route_type === "wire" &&
            Math.hypot(start.x - port.x, start.y - port.y) < 1e-6
          )
        })!
        expect(trace).toBeDefined()
        const via = trace.route.find((point) => point.route_type === "via")!
        expect(Math.abs(via.x - port.x)).toBeCloseTo(0.4, 6)
        expect(Math.abs(via.y - port.y)).toBeCloseTo(0.4, 6)
        expect(trace.route[0]).toMatchObject({ layer })
        expect(trace.route.at(-1)).toMatchObject({
          layer: "inner2",
          x: via.x,
          y: via.y,
        })
      }
      await expect(circuit).toMatchPcbSnapshot(
        import.meta.path.replace(".test.tsx", `-${layer}-${rotation}.test.tsx`),
      )
    }
  }
})
