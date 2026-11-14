import type { PcbTraceProps } from "@tscircuit/props"
import { expect, test } from "bun:test"
import type { Board } from "lib/components/normal-components/Board/Board"
import type { PcbTrace } from "lib/components/primitive-components/PcbTrace"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "pcbtrace retains explicit metadata and resolves coordinates after layer transitions",
  testPcbTraceMixedRouteMetadata,
)

async function testPcbTraceMixedRouteMetadata() {
  const { circuit } = getTestFixture()
  const props = {
    layer: "top",
    thickness: "0.2mm",
    route: [
      {
        route_type: "wire",
        x: "-6mm",
        y: "0mm",
        width: "0.4mm",
        layer: "bottom",
        start_width: "0.4mm",
        end_width: "0.8mm",
        width_interpolation_mode: "linear",
      },
      { x: "-4mm", y: "0mm", trace_width: "0.3mm" },
      {
        route_type: "via",
        x: "-2mm",
        y: "0mm",
        from_layer: "bottom",
        to_layer: "inner1",
        hole_diameter: "0.4mm",
        outer_diameter: "0.9mm",
        tented_on_top: true,
        tented_on_bottom: false,
      },
      { x: "0mm", y: "0mm" },
      {
        route_type: "through_pad",
        start: { x: "2mm", y: "0mm" },
        end: { x: "3mm", y: "0mm" },
        width: "0.8mm",
        start_layer: "inner1",
        end_layer: "top",
      },
      { x: "5mm", y: "0mm" },
    ],
  } satisfies PcbTraceProps
  circuit.add(
    <board width={24} height={9} layers={4} routingDisabled>
      <pcbtrace {...props} />
      <platedhole
        pcbX={2.5}
        pcbY={0}
        shape="circle"
        holeDiameter={0.4}
        outerDiameter={1.5}
      />
      <pcbnotetext
        text="BOTTOM → VIA → INNER1 → PAD → TOP"
        pcbY={2.5}
        fontSize={0.55}
        layer="top"
      />
    </board>,
  )
  const board = circuit.children[0] as Board
  const copper = board.selectOne<PcbTrace>("pcbtrace")
  const parsedProps = copper && structuredClone(copper._parsedProps)
  if (copper) {
    for (const point of copper._parsedProps.route) {
      if ("route_type" in point && point.route_type === "through_pad") {
        Object.freeze(point.start)
        Object.freeze(point.end)
      }
      Object.freeze(point)
    }
    Object.freeze(copper._parsedProps.route)
    Object.freeze(copper._parsedProps)
  }
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
    shouldDrawErrors: false,
  })

  expect(copper).not.toBeNull()

  const route = circuit.db.pcb_trace.get(copper!.pcb_trace_id!)!.route
  expect(route[0]).toEqual({
    route_type: "wire",
    x: -6,
    y: 0,
    width: 0.4,
    layer: "bottom",
    start_width: 0.4,
    end_width: 0.8,
    width_interpolation_mode: "linear",
  })
  expect(route[1]).toEqual({
    route_type: "wire",
    x: -4,
    y: 0,
    width: 0.3,
    layer: "bottom",
  })
  expect(route[2]).toMatchObject({
    route_type: "via",
    from_layer: "bottom",
    to_layer: "inner1",
    hole_diameter: 0.4,
    outer_diameter: 0.9,
    tented_on_top: true,
    tented_on_bottom: false,
  })
  expect(route[3]).toEqual({
    route_type: "wire",
    x: 0,
    y: 0,
    width: 0.2,
    layer: "inner1",
  })
  expect(route[4]).toEqual({
    route_type: "through_pad",
    start: { x: 2, y: 0 },
    end: { x: 3, y: 0 },
    width: 0.8,
    start_layer: "inner1",
    end_layer: "top",
  })
  expect(route[5]).toEqual({
    route_type: "wire",
    x: 5,
    y: 0,
    width: 0.2,
    layer: "top",
  })
  expect(copper!._parsedProps).toEqual(parsedProps!)
}
