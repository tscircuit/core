import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { captureRunEvidence } from "tests/fixtures/capture-run-evidence"
import { renderPcbLayers } from "tests/fixtures/render-pcb-layers"

test.failing(
  "pcbPath and pcbPaths retain styled via sizes in route points",
  async () => {
    const { circuit } = getTestFixture()
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
          name="PATH"
          from="U1.1"
          to="net.GND"
          pcbPath={[
            { x: 0, y: 0 },
            { x: 2, y: 0, via: true, toLayer: "bottom" },
            { x: 3, y: 0 },
          ]}
        />
        <trace
          name="PATHS"
          from="U1.1"
          to="net.GND"
          pcbPaths={[
            [
              { x: 0, y: 0 },
              { x: 2, y: -1, via: true, toLayer: "bottom" },
              { x: 3, y: -1 },
            ],
          ]}
        />
        <pcbnotetext text="pcbPath" pcbX={2} pcbY={1} fontSize={0.4} />
        <pcbnotetext text="pcbPaths" pcbX={2} pcbY={-2} fontSize={0.4} />
      </board>,
    )
    await circuit.renderUntilSettled()
    const circuitJson = circuit.getCircuitJson()
    await expect(
      renderPcbLayers(
        circuitJson,
        "Expected: both route vias retain 0.7 mm pads / 0.3 mm drills.",
      ),
    ).toMatchSvgSnapshot(
      import.meta.path,
      "inline-via-route-diameters-pcb-layers",
    )
    const vias = circuit.db.pcb_via.list()
    expect(vias).toHaveLength(2)
    for (const via of vias)
      expect(via).toMatchObject({ outer_diameter: 0.7, hole_diameter: 0.3 })
    const observed = []
    for (const [index, trace] of circuit.db.pcb_trace.list().entries()) {
      const routeVia = trace.route.find((point) => point.route_type === "via")!
      await captureRunEvidence(
        circuitJson,
        `${index === 0 ? "pcbPath" : "pcbPaths"}: physical via 0.7 / 0.3 mm; route ${routeVia.outer_diameter ?? "missing"} / ${routeVia.hole_diameter ?? "missing"}.`,
        index === 0 ? "pcb-path" : "pcb-paths",
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
  },
)
