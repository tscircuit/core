import { expect, test } from "bun:test"
import { pointToSegmentDistance } from "@tscircuit/math-utils"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// PCB points are board-world mm: +X right, +Y up. The ground route changes
// signal layers at top/inner1, but both drilled barrels cross all four layers.
test("later routing must not run a supply net through a fixed ground drill", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={14} height={12} layers={4} minTraceWidth={0.2}>
      {(
        [
          ["SUPPLY_LEFT", -4, 0, "bottom"],
          ["SUPPLY_RIGHT", 4, 0, "bottom"],
          ["GROUND_START", 0, -3, "top"],
          ["GROUND_END", 0, 3, "top"],
        ] as const
      ).map(([name, pcbX, pcbY, layer]) => (
        <chip
          key={name}
          name={name}
          pcbX={pcbX}
          pcbY={pcbY}
          layer={layer}
          footprint={
            <footprint>
              <smtpad portHints={["1"]} width={1} height={1} shape="rect" />
            </footprint>
          }
        />
      ))}
      <trace from="SUPPLY_LEFT.1" to="net.V3V3" />
      <trace from="SUPPLY_RIGHT.1" to="net.V3V3" />
      <trace from="GROUND_START.1" to="GROUND_END.1" />
      <autoroutingphase
        phaseIndex={0}
        connection="GROUND_START.1"
        pcbTracePaths={[
          {
            connection: "GROUND_START.1",
            route: [
              { route_type: "wire", x: 0, y: -3, width: 0.2, layer: "top" },
              {
                route_type: "via",
                x: 0,
                y: 0,
                from_layer: "top",
                to_layer: "inner1",
                via_diameter: 0.7,
                via_hole_diameter: 0.3,
              },
              { route_type: "wire", x: 0, y: 2, width: 0.2, layer: "inner1" },
              {
                route_type: "via",
                x: 0,
                y: 2,
                from_layer: "inner1",
                to_layer: "top",
                via_diameter: 0.7,
                via_hole_diameter: 0.3,
              },
              { route_type: "wire", x: 0, y: 3, width: 0.2, layer: "top" },
            ],
          },
        ]}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={5}
        anchorAlignment="center"
        text="Repro: bottom supply crosses a through ground via"
        fontSize={0.45}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(
    `${import.meta.path.replace(".test.tsx", "")}-top`,
    {
      layer: "top",
      showDebugObjects: false,
    },
  )
  await expect(circuit).toMatchPcbSnapshot(
    `${import.meta.path.replace(".test.tsx", "")}-bottom`,
    {
      layer: "bottom",
      showDebugObjects: false,
    },
  )

  const groundVia = circuit.db.pcb_via
    .list()
    .find((via) => via.x === 0 && via.y === 0)!
  expect([...groundVia.layers].sort()).toEqual([
    "bottom",
    "inner1",
    "inner2",
    "top",
  ])
  const drillClearances = circuit.db.pcb_trace.list().flatMap((trace) =>
    trace.route.slice(1).flatMap((end, index) => {
      const start = trace.route[index]!
      if (
        start.route_type !== "wire" ||
        end.route_type !== "wire" ||
        start.layer !== "bottom" ||
        end.layer !== "bottom"
      )
        return []
      return [
        pointToSegmentDistance(groundVia, start, end) -
          Math.max(start.width, end.width) / 2 -
          groundVia.hole_diameter / 2,
      ]
    }),
  )
  // Assert against the emitted copper and actual drill, rather than the SRJ
  // layer metadata. Current core emits a straight trace: clearance = -0.25 mm.
  expect(drillClearances.length).toBeGreaterThan(0)
  expect(Math.min(...drillClearances)).toBeGreaterThanOrEqual(0)
})
