import { expect, test } from "bun:test"
import { Fragment } from "react"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbtrace materializes route vias with explicit dimensions or PCB style defaults", async () => {
  const { circuit } = getTestFixture()
  const viaCases = [
    { x: -10, outer_diameter: 2, hole_diameter: 1, label: "EXPLICIT: 2 / 1mm" },
    { x: -3, label: "STYLE: 0.9 / 0.45mm" },
    { x: 4, outer_diameter: 1.4, label: "PAD: 1.4 / 0.45mm" },
    { x: 11, hole_diameter: 0.6, label: "DRILL: 0.9 / 0.6mm" },
  ]

  circuit.add(
    <board
      width={30}
      height={12}
      layers={4}
      pcbStyle={{ viaPadDiameter: 0.9, viaHoleDiameter: 0.45 }}
    >
      {viaCases.map(({ x, label, ...diameters }) => {
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
        return (
          <Fragment key={x}>
            <pcbtrace route={route} />
            <pcbnotetext
              pcbX={x}
              pcbY={2}
              layer="bottom"
              fontSize={0.5}
              text={label}
            />
          </Fragment>
        )
      })}
      <via
        pcbX={-10}
        pcbY={0}
        fromLayer="top"
        toLayer="inner1"
        outerDiameter={2}
        holeDiameter={1}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-3}
        layer="bottom"
        fontSize={0.55}
        text="BOTTOM VIEW: TOP / INNER1 VIA SHARES THE LEFT POSITION"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  const pcbVias = circuit.db.pcb_via.list()
  expect(pcbTraces).toHaveLength(4)
  expect(pcbVias).toHaveLength(5)
  for (const pcbTrace of pcbTraces) {
    const routeVia = pcbTrace.route.find((point) => point.route_type === "via")!
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
      from_layer: "bottom",
      to_layer: "inner1",
      tented_on_top: true,
      tented_on_bottom: false,
      subcircuit_id: pcbTrace.subcircuit_id,
      pcb_group_id: pcbTrace.pcb_group_id,
    })
  }

  // Rendering again must not insert a second physical via for the same route.
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_via.list()).toHaveLength(5)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
    showSolderMask: true,
    showPcbNotes: true,
    shouldDrawErrors: false,
  })
})
