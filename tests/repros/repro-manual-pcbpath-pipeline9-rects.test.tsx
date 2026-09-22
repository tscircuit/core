import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "tests/fixtures/extend-expect-autorouting-phases-snapshot"

// Diagnostic reproduction of b8507e92-405d-4189-9e67-9e1e751e8ccd.
// This pins the current BUG, not the desired contract. After a fix, assert that
// MANUAL stays in input.traces and these six rectangles are absent instead.
test("default Pipeline9 rasterizes a manual path matching the MCU report", async () => {
  const { circuit } = getTestFixture()
  const inputs: SimpleRouteJson[] = []
  const solverNames: string[] = []
  circuit.on("autorouting:start", (event) => {
    inputs.push(structuredClone(event.simpleRouteJson))
    solverNames.push(event.solverName!)
  })
  circuit.add(
    <board width={12} height={10} minTraceWidth={0.25}>
      <chip name="PIN" pcbX={-3.4375} pcbY={-0.75} pinLabels={{ pin1: "GND" }}>
        <footprint>
          <smtpad
            portHints={["pin1"]}
            shape="rect"
            width={0.875}
            height={0.25}
            pcbX={0}
            pcbY={0}
          />
        </footprint>
      </chip>
      <chip name="EP" pcbX={0} pcbY={0} pinLabels={{ pin1: "GND" }}>
        <footprint>
          <smtpad
            portHints={["pin1"]}
            shape="rect"
            width={0.5}
            height={0.5}
            pcbX={0}
            pcbY={0}
          />
        </footprint>
      </chip>
      <trace
        name="MANUAL"
        from="PIN.pin1"
        to="EP.pin1"
        thickness={0.25}
        pcbPath={[{ x: 2.6875, y: 0 }]}
      />
      <testpoint name="A" pcbX={-4} pcbY={2} padDiameter={0.6} />
      <testpoint name="B" pcbX={4} pcbY={2} padDiameter={0.6} />
      <trace from="A.pin1" to="B.pin1" />
      <pcbnotetext
        pcbY={-3}
        fontSize={0.35}
        text="Default Pipeline9: manual diagonal becomes 6 rectangles"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(solverNames).toEqual([
    "AutoroutingPipelineSolver9_PreloadedTraceGraph",
  ])
  const manual = circuit.db.source_trace
    .list()
    .find((trace) => trace.name === "MANUAL")!
  const input = inputs[0]!
  const rectangles = input.obstacles.filter(
    (obstacle) => obstacle.connectedTo[0] === manual.source_trace_id,
  )
  expect(rectangles).toHaveLength(6)
  expect(
    input.traces?.some(
      (trace) => trace.connection_name === manual.source_trace_id,
    ),
  ).toBe(false)
  // Exactly the source_trace_107 geometry in the downloaded report: a 2.6875mm
  // horizontal segment, then a 0.75mm diagonal divided into five 0.4mm boxes.
  expect(rectangles[0]).toMatchObject({
    center: { x: -2.09375, y: -0.75 },
    width: 2.9375,
    height: 0.25,
    layers: ["top"],
  })
  for (const [index, rectangle] of rectangles.slice(1).entries()) {
    expect(rectangle.width).toBeCloseTo(0.4, 10)
    expect(rectangle.height).toBeCloseTo(0.4, 10)
    expect(rectangle.center.x).toBeCloseTo(-0.675 + index * 0.15, 10)
    expect(rectangle.center.y).toBeCloseTo(-0.675 + index * 0.15, 10)
  }
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect([
    { startSimpleRouteJson: input },
  ]).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "manual-pcbpath-pipeline9-input",
  )
})
