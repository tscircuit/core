import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { captureRunEvidence } from "tests/fixtures/capture-run-evidence"

test("pcbPath and pcbPaths retain styled via sizes in replayable route points", async () => {
  const observed = []
  const snapshots: string[] = []
  for (const multiple of [false, true]) {
    const { circuit } = getTestFixture()
    const path = [
      { x: 0, y: 0 },
      { x: 2, y: 0, via: true, toLayer: "bottom" as const },
      { x: 3, y: 0 },
    ]
    circuit.add(
      <board
        width={10}
        height={6}
        layers={4}
        schematicDisabled
        routingDisabled
        minViaHoleDiameter={0.2}
        minViaPadDiameter={0.5}
        pcbStyle={{ viaHoleDiameter: 0.3, viaPadDiameter: 0.7 }}
      >
        <chip
          name="U1"
          pinLabels={{ pin1: "GND" }}
          footprint={
            <footprint>
              <smtpad shape="rect" width={0.8} height={0.8} portHints={["1"]} />
            </footprint>
          }
        />
        <trace
          from="U1.1"
          to="net.GND"
          {...(multiple ? { pcbPaths: [path] } : { pcbPath: path })}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const via = circuit.db.pcb_via.list()[0]!
    const routeVia = circuit.db.pcb_trace
      .list()[0]!
      .route.find((point) => point.route_type === "via")!
    expect(via).toMatchObject({ outer_diameter: 0.7, hole_diameter: 0.3 })
    snapshots.push(
      await captureRunEvidence(
        circuit.getCircuitJson(),
        `${multiple ? "pcbPaths" : "pcbPath"}: physical via 0.7 / 0.3 mm; route ${routeVia.outer_diameter ?? "missing"} / ${routeVia.hole_diameter ?? "missing"}.`,
        multiple ? "pcb-paths" : "pcb-path",
      ),
    )
    observed.push({
      outer: routeVia.outer_diameter,
      hole: routeVia.hole_diameter,
    })
  }
  expect(observed).toEqual([
    { outer: 0.7, hole: 0.3 },
    { outer: 0.7, hole: 0.3 },
  ])
  for (const [index, svg] of snapshots.entries())
    await expect(svg).toMatchSvgSnapshot(
      import.meta.path,
      `inline-via-route-diameters-${index}`,
    )
})
