import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("global routing continues from a local dogbone via", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={16}
      height={12}
      minTraceWidth={0.1}
      minViaPadDiameter={0.3}
      minViaHoleDiameter={0.15}
    >
      <fanout autorouter="dogbone" fanoutRoutingLayers={["bottom"]}>
        <chip
          name="U1"
          pcbX={-3}
          footprint={
            <footprint>
              <smtpad
                portHints={["1"]}
                shape="circle"
                radius={0.2}
                pcbX={0}
                pcbY={0}
              />
              <smtpad
                portHints={["2"]}
                shape="circle"
                radius={0.2}
                pcbX={0.8}
                pcbY={0}
              />
              <smtpad
                portHints={["3"]}
                shape="circle"
                radius={0.2}
                pcbX={0}
                pcbY={0.8}
              />
              <smtpad
                portHints={["4"]}
                shape="circle"
                radius={0.2}
                pcbX={0.8}
                pcbY={0.8}
              />
            </footprint>
          }
        />
      </fanout>
      <resistor
        name="R1"
        footprint="0402"
        resistance="1k"
        layer="bottom"
        pcbX={4}
      />
      <trace from="U1.1" to="R1.1" />
      <pcbnotetext
        pcbY={4}
        text="Local dogbone, then bottom-layer routing to R1"
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  expect(circuit.db.pcb_via.list()).toHaveLength(1)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(1)
  const exit = circuit.db.pcb_breakout_point.list()[0]!
  expect(exit.layer).toBe("bottom")
  expect(
    circuit.db.pcb_trace
      .list()
      .filter((trace) =>
        trace.route.some(
          (point) =>
            point.route_type === "wire" &&
            point.layer === "bottom" &&
            Math.hypot(point.x - exit.x, point.y - exit.y) < 1e-6,
        ),
      ).length,
  ).toBeGreaterThan(1)
  // The local phase outlines U1, while the remaining route uses the board.
  const fanoutOutline = circuit.db.pcb_debug_object
    .list()
    .find((object) => object.label === "autorouting phase fanout")!
  const defaultOutline = circuit.db.pcb_debug_object
    .list()
    .find((object) => object.label === "autorouting phase default")!
  expect(fanoutOutline.shape).toBe("rect")
  expect(defaultOutline.shape).toBe("rect")
  if (fanoutOutline.shape !== "rect" || defaultOutline.shape !== "rect") {
    throw new Error("Expected routing phase rectangles")
  }
  for (const pad of circuit.db.pcb_smtpad
    .list()
    .filter((pad) => pad.shape === "circle")) {
    expect(Math.abs(pad.x - fanoutOutline.center.x)).toBeLessThanOrEqual(
      fanoutOutline.size.width / 2,
    )
    expect(Math.abs(pad.y - fanoutOutline.center.y)).toBeLessThanOrEqual(
      fanoutOutline.size.height / 2,
    )
  }
  expect(fanoutOutline.center.x + fanoutOutline.size.width / 2).toBeLessThan(4)
  expect(fanoutOutline.size.width).toBeLessThan(defaultOutline.size.width)
  expect(defaultOutline.size).toEqual({ width: 16, height: 12 })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
