import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbtrace renders public route hints with widths and layer transitions", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={22}
      height={16}
      layers={4}
      routingDisabled
      pcbStyle={{ viaPadDiameter: 0.8, viaHoleDiameter: 0.4 }}
    >
      <pcbnotetext text="TOP -> INNER1 -> BOTTOM" pcbY={6} fontSize={0.6} />
      <pcbtrace
        layer="top"
        thickness="0.2mm"
        route={[
          { x: -6, y: 3, trace_width: "0.3mm" },
          { x: -2, y: 3, via: true, to_layer: "inner1" },
          { x: 2, y: 3, trace_width: "0.4mm" },
          { x: 4, y: 3, via: true, to_layer: "bottom" },
          { x: 6, y: 3 },
        ]}
      />
      <pcbnotetext text="DEFAULT VIA: BOTTOM -> TOP" pcbY={-1} fontSize={0.6} />
      <pcbtrace
        layer="bottom"
        thickness="0.25mm"
        route={[
          { x: -6, y: -4 },
          { x: 0, y: -4, via: true },
          { x: 6, y: -4, trace_width: "0.5mm" },
        ]}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const traces = circuit.db.pcb_trace.list()
  expect(traces.map((trace) => trace.route)).toEqual([
    [
      { route_type: "wire", x: -6, y: 3, width: 0.3, layer: "top" },
      { route_type: "via", x: -2, y: 3, from_layer: "top", to_layer: "inner1" },
      { route_type: "wire", x: 2, y: 3, width: 0.4, layer: "inner1" },
      {
        route_type: "via",
        x: 4,
        y: 3,
        from_layer: "inner1",
        to_layer: "bottom",
      },
      { route_type: "wire", x: 6, y: 3, width: 0.2, layer: "bottom" },
    ],
    [
      { route_type: "wire", x: -6, y: -4, width: 0.25, layer: "bottom" },
      { route_type: "via", x: 0, y: -4, from_layer: "bottom", to_layer: "top" },
      { route_type: "wire", x: 6, y: -4, width: 0.5, layer: "top" },
    ],
  ])
  expect(circuit.db.pcb_via.list()).toHaveLength(3)
  expect(circuit.db.pcb_via.list().map((via) => via.layers)).toEqual([
    ["top", "inner1"],
    ["inner1", "inner2", "bottom"],
    ["bottom", "inner2", "inner1", "top"],
  ])
  for (const trace of traces) {
    for (const point of trace.route) {
      if (point.route_type !== "via") continue
      expect(circuit.db.pcb_via.list()).toContainEqual(
        expect.objectContaining({
          pcb_trace_id: trace.pcb_trace_id,
          x: point.x,
          y: point.y,
          from_layer: point.from_layer,
          to_layer: point.to_layer,
          outer_diameter: 0.8,
          hole_diameter: 0.4,
        }),
      )
    }
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
    shouldDrawErrors: false,
  })
})
