import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "pcbtrace shorthand follows its footprint pads on both sides at every quarter turn",
  testPcbTraceFootprintTransforms,
)

async function testPcbTraceFootprintTransforms() {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={56}
      height={30}
      layers={4}
      routingDisabled
      pcbStyle={{ viaPadDiameter: 0.8, viaHoleDiameter: 0.4 }}
    >
      {(["top", "bottom"] as const).flatMap((layer, row) =>
        [0, 90, 180, 270].map((rotation, column) => (
          <Fragment key={`${layer}-${rotation}`}>
            <chip
              name={`${layer === "top" ? "T" : "B"}${rotation}`}
              pcbX={column * 12 - 18}
              pcbY={row === 0 ? 6 : -6}
              pcbRotation={rotation}
              layer={layer}
              internallyConnectedPins={[["pin1", "pin2"]]}
              footprint={
                <footprint>
                  <smtpad
                    portHints={["pin1"]}
                    pcbX={-3}
                    pcbY={-1}
                    width={1}
                    height={1}
                    shape="rect"
                    layer="top"
                  />
                  <smtpad
                    portHints={["pin2"]}
                    pcbX={2}
                    pcbY={1}
                    width={1}
                    height={1}
                    shape="rect"
                    layer="top"
                  />
                  <pcbtrace
                    thickness="0.25mm"
                    route={[
                      { x: "-3mm", y: "-1mm", trace_width: "0.3mm" },
                      {
                        route_type: "via",
                        x: "-2mm",
                        y: "-0.6mm",
                        from_layer: "top",
                        to_layer: layer === "top" ? "inner1" : "bottom",
                      },
                      { x: "-0.5mm", y: "0mm", trace_width: "0.4mm" },
                      {
                        route_type: "via",
                        x: "1mm",
                        y: "0.6mm",
                        from_layer: layer === "top" ? "inner1" : "bottom",
                        to_layer: "top",
                      },
                      { x: "2mm", y: "1mm" },
                    ]}
                  />
                </footprint>
              }
            />
            <pcbnotetext
              text={`${layer.toUpperCase()}: ${rotation}deg`}
              pcbX={column * 12 - 18}
              pcbY={row === 0 ? 12 : -12}
              fontSize={0.7}
              layer="top"
            />
          </Fragment>
        )),
      )}
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
    shouldDrawErrors: false,
  })

  const traces = circuit.db.pcb_trace.list()
  expect(traces).toHaveLength(8)
  for (const trace of traces) {
    const pads = circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.shape === "rect")
      .filter((pad) => pad.pcb_component_id === trace.pcb_component_id)
    const wires = trace.route.filter((point) => point.route_type === "wire")
    expect(wires).toHaveLength(3)
    expect(wires.map((wire) => wire.width)).toEqual([0.3, 0.4, 0.25])
    const endpoints = [wires[0], wires[2]]
    for (const [pinIndex, wire] of endpoints.entries()) {
      const pad = pads.find((pad) =>
        pad.port_hints?.includes(`pin${pinIndex + 1}`),
      )!
      expect(wire.x).toBeCloseTo(pad.x, 8)
      expect(wire.y).toBeCloseTo(pad.y, 8)
      expect(wire.layer).toBe(pad.layer)
    }
    const vias = trace.route.filter((point) => point.route_type === "via")
    expect(vias).toHaveLength(2)
    const viaLayers =
      endpoints[0].layer === "top"
        ? [
            ["top", "inner1"],
            ["inner1", "top"],
          ]
        : [
            ["bottom", "inner2", "inner1", "top"],
            ["top", "inner1", "inner2", "bottom"],
          ]
    for (const [viaIndex, via] of vias.entries()) {
      const fraction = viaIndex === 0 ? 0.2 : 0.8
      expect(via.x).toBeCloseTo(
        endpoints[0].x + (endpoints[1].x - endpoints[0].x) * fraction,
        8,
      )
      expect(via.y).toBeCloseTo(
        endpoints[0].y + (endpoints[1].y - endpoints[0].y) * fraction,
        8,
      )
      expect(via.from_layer).toBe(wires[viaIndex].layer)
      expect(via.to_layer).toBe(wires[viaIndex + 1].layer)
      expect(circuit.db.pcb_via.list()).toContainEqual(
        expect.objectContaining({
          pcb_trace_id: trace.pcb_trace_id,
          x: via.x,
          y: via.y,
          from_layer: via.from_layer,
          to_layer: via.to_layer,
          layers: viaLayers[viaIndex],
          outer_diameter: 0.8,
          hole_diameter: 0.4,
        }),
      )
    }
    expect(wires[1].layer).not.toBe(endpoints[0].layer)
  }
  expect(circuit.db.pcb_via.list()).toHaveLength(16)
}
