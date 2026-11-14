import { expect, test } from "bun:test"
import type { PcbTraceRoutePoint } from "circuit-json"
import { Board } from "lib/components/normal-components/Board/Board"
import { PcbTrace } from "lib/components/primitive-components/PcbTrace"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbtrace preserves Circuit JSON geometry and its source trace association", async () => {
  const { circuit } = getTestFixture()
  const sourceTrace = circuit.db.source_trace.insert({
    connected_source_port_ids: [],
    connected_source_net_ids: [],
  })
  const route = [
    {
      route_type: "wire",
      x: -4,
      y: 0,
      width: 0.2,
      layer: "top",
      start_width: 0.2,
      end_width: 0.4,
      width_interpolation_mode: "linear",
    },
    { route_type: "wire", x: -2, y: 0, width: 0.4, layer: "top" },
    {
      route_type: "via",
      x: -2,
      y: 0,
      from_layer: "top",
      to_layer: "bottom",
      hole_diameter: 0.4,
      outer_diameter: 0.8,
      tented_on_top: true,
      tented_on_bottom: false,
    },
    {
      route_type: "wire",
      x: -2,
      y: 0,
      width: 0.4,
      layer: "bottom",
      is_inside_copper_pour: true,
    },
    {
      route_type: "through_pad",
      start: { x: 1, y: 0 },
      end: { x: 2, y: 0 },
      width: 0.6,
      start_layer: "bottom",
      end_layer: "top",
    },
    { route_type: "wire", x: 3, y: 0, width: 0.2, layer: "top" },
  ] satisfies PcbTraceRoutePoint[]
  const originalRoute = structuredClone(route)
  for (const point of route) {
    if (point.route_type === "through_pad") {
      Object.freeze(point.start)
      Object.freeze(point.end)
    }
    Object.freeze(point)
  }
  Object.freeze(route)
  const copper = new PcbTrace({
    route,
    source_trace_id: sourceTrace.source_trace_id,
  })
  const parsedInput = structuredClone(copper._parsedProps)
  Object.freeze(copper._parsedProps.route)
  Object.freeze(copper._parsedProps)
  const board = new Board({ width: 14, height: 8, routingDisabled: true })
  board.add(copper)
  board.add(
    <pcbnotetext
      text="CIRCUIT JSON: TAPER / VIA / THROUGH PAD"
      pcbY={2}
      fontSize={0.45}
    />,
  )
  circuit.add(board)

  expect(copper.getPcbSize().width).toBeCloseTo(7.2)
  expect(copper.getPcbSize().height).toBeCloseTo(0.6)
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_trace.get(copper.pcb_trace_id!)!).toMatchObject({
    source_trace_id: sourceTrace.source_trace_id,
    route: originalRoute,
  })
  expect(circuit.db.pcb_via.list()).toContainEqual(
    expect.objectContaining({
      pcb_trace_id: copper.pcb_trace_id,
      hole_diameter: 0.4,
      outer_diameter: 0.8,
      tented_on_top: true,
      tented_on_bottom: false,
    }),
  )
  expect(route).toEqual(originalRoute)
  expect(copper._parsedProps).toEqual(parsedInput)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
    shouldDrawErrors: false,
  })
})
