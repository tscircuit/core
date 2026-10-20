import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board/Board"
import { PcbTrace } from "lib/components/primitive-components/PcbTrace"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbtrace materializes route vias with explicit dimensions or PCB style defaults", async () => {
  const { circuit } = getTestFixture()
  const viaCases = [
    { x: -10, outer_diameter: 2, hole_diameter: 1 },
    { x: -3 },
    { x: 4, outer_diameter: 1.4 },
    { x: 11, hole_diameter: 0.6 },
  ]
  const board = new Board({
    width: 30,
    height: 12,
    layers: 4,
    pcbStyle: { viaPadDiameter: 0.9, viaHoleDiameter: 0.45 },
  })
  for (const { x, ...diameters } of viaCases) {
    const route = [
      { route_type: "wire", x: x - 2, y: 0, layer: "bottom", width: 0.2 },
      { route_type: "wire", x, y: 0, layer: "bottom", width: 0.2 },
      {
        route_type: "via",
        x,
        y: 0,
        from_layer: "bottom",
        to_layer: "inner1",
        tented_on_top: true,
        tented_on_bottom: false,
        ...diameters,
      },
    ] satisfies PcbTraceRoutePoint[]
    board.add(new PcbTrace({ route }))
  }
  circuit.add(board)
  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  const pcbVias = circuit.db.pcb_via.list()
  expect(pcbTraces).toHaveLength(4)
  expect(pcbVias).toHaveLength(4)
  for (const pcbTrace of pcbTraces) {
    const routeVia = pcbTrace.route.find((point) => point.route_type === "via")!
    expect(routeVia).toMatchObject({
      from_layer: "bottom",
      to_layer: "inner1",
    })
    const materializedVias = pcbVias.filter(
      (via) => via.pcb_trace_id === pcbTrace.pcb_trace_id,
    )
    expect(materializedVias).toHaveLength(1)
    expect(materializedVias[0]).toMatchObject({
      x: routeVia.x,
      y: routeVia.y,
      outer_diameter: routeVia.outer_diameter ?? 0.9,
      hole_diameter: routeVia.hole_diameter ?? 0.45,
      layers: ["bottom", "inner2", "inner1"],
      tented_on_top: true,
      tented_on_bottom: false,
      subcircuit_id: pcbTrace.subcircuit_id,
      pcb_group_id: pcbTrace.pcb_group_id,
    })
    expect(materializedVias[0]).not.toHaveProperty("from_layer")
    expect(materializedVias[0]).not.toHaveProperty("to_layer")
  }
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_via.list()).toHaveLength(4)
})
