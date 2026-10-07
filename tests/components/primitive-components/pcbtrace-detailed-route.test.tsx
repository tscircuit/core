import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board/Board"
import { PcbTrace } from "lib/components/primitive-components/PcbTrace"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("detailed PCB routes retain metadata and imported source identity", () => {
  const route: PcbTraceRoutePoint[] = [
    {
      route_type: "wire",
      x: -3,
      y: 0,
      width: 0.2,
      layer: "top",
      start_width: 0.2,
      end_width: 0.4,
      width_interpolation_mode: "linear",
      start_pcb_port_id: "pcb_port_start",
    },
    {
      route_type: "wire",
      x: 0,
      y: 0,
      width: 0.4,
      layer: "top",
      is_inside_copper_pour: true,
      copper_pour_id: "pour_original",
    },
    {
      route_type: "via",
      x: 0,
      y: 0,
      from_layer: "top",
      to_layer: "bottom",
      hole_diameter: 0.3,
      outer_diameter: 0.6,
      tented_on_top: true,
      tented_on_bottom: false,
    },
    { route_type: "wire", x: 0, y: 0, width: 0.4, layer: "bottom" },
    { route_type: "wire", x: 2, y: 0, width: 0.4, layer: "bottom" },
    {
      route_type: "through_pad",
      start: { x: 2, y: 0 },
      end: { x: 3, y: 0 },
      width: 0.4,
      start_layer: "bottom",
      end_layer: "top",
      pcb_plated_hole_id: "hole_original",
    },
  ]
  const original = structuredClone(route)
  const { circuit } = getTestFixture()
  const board = new Board({ width: 12, height: 10 })
  circuit.add(board)
  board.add(
    <>
      <pcbnotetext
        text="Detailed route metadata preserved"
        pcbY={3.5}
        fontSize={0.4}
      />
    </>,
  )
  board.add(new PcbTrace({ route, source_trace_id: "source_trace_imported" }))
  circuit.render()
  expect(circuit.db.pcb_trace.list()[0]).toMatchObject({
    route: original,
    source_trace_id: "source_trace_imported",
  })
  expect(route).toEqual(original)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
