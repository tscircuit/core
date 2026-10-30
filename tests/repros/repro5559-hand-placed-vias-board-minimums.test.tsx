import { expect, test } from "bun:test"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pcbtraceRoute = [
  { route_type: "wire", x: -6, y: -3, width: 0.15, layer: "top" },
  { route_type: "wire", x: -4, y: -3, width: 0.15, layer: "top" },
  { route_type: "via", x: -4, y: -3, from_layer: "top", to_layer: "bottom" },
  { route_type: "wire", x: -4, y: -3, width: 0.15, layer: "bottom" },
  { route_type: "wire", x: -2, y: -3, width: 0.15, layer: "bottom" },
] satisfies PcbTraceRoutePoint[]

test("repro5559: pcbPath, pcbtrace and <via> vias default to the board's via minimums", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="10mm"
      minTraceWidth={0.15}
      minViaHoleDiameter={0.3}
      minViaPadDiameter={0.6}
      routingDisabled
    >
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={0} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={6} pcbY={0} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        thickness={0.15}
        pcbPath={[
          { x: 2, y: 2 },
          { x: 2, y: 2, via: true, fromLayer: "top", toLayer: "bottom" },
          { x: 2, y: 2 },
          { x: 4, y: 2 },
          { x: 4, y: 2, via: true, fromLayer: "bottom", toLayer: "top" },
          { x: 4, y: 2 },
        ]}
      />
      <via pcbX={-6} pcbY={3} fromLayer="top" toLayer="bottom" />
      <pcbtrace route={pcbtraceRoute} />
      <pcbnotetext
        pcbX={0}
        pcbY={4.2}
        fontSize={0.45}
        text="board minVia 0.3/0.6mm: all vias 0.3/0.6mm"
      />
      <pcbnotetext pcbX={-6} pcbY={2} fontSize={0.4} text="<via>" />
      <pcbnotetext pcbX={3} pcbY={3} fontSize={0.4} text="pcbPath vias" />
      <pcbnotetext pcbX={-4} pcbY={-4} fontSize={0.4} text="pcbtrace via" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.pcb_via
      .list()
      .map((via) => [via.hole_diameter, via.outer_diameter]),
  ).toEqual([
    [0.3, 0.6],
    [0.3, 0.6],
    [0.3, 0.6],
    [0.3, 0.6],
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
