import { expect, test } from "bun:test"
import { su } from "@tscircuit/circuit-json-util"
import type {
  PcbCopperPourBRep,
  PcbCopperPourRect,
  PcbNoteLine,
  PcbTrace,
  PcbTraceRoutePointWire,
  SourceTrace,
} from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { markTraceSegmentsInsideCopperPour } from "lib/components/primitive-components/CopperPour/utils/mark-trace-segments-inside-copper-pour"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"

/** Board-world points in mm: +X right, +Y up, +Z above the PCB (right handed). */
const wire = (
  x: number,
  y: number,
  layer: PcbTraceRoutePointWire["layer"] = "top",
): PcbTraceRoutePointWire => ({ route_type: "wire", x, y, layer, width: 0.15 })
const square: [number, number][] = [
  [0, 0],
  [0, 10],
  [10, 10],
  [10, 0],
]
const ring = (points: [number, number][]) => ({
  vertices: points.map(([x, y]) => ({ x, y })),
})
const pour = (
  outer = square,
  holes: [number, number][][] = [],
): PcbCopperPourBRep => ({
  type: "pcb_copper_pour",
  pcb_copper_pour_id: "pour",
  source_net_id: "gnd",
  shape: "brep",
  layer: "top",
  covered_with_solder_mask: false,
  brep_shape: { outer_ring: ring(outer), inner_rings: holes.map(ring) },
})

/** Draw pour boundaries as notes in board-world XY mm (+X right, +Y up, +Z above). */
const getPourBoundaryNotes = (
  copperPour: PcbCopperPourBRep | PcbCopperPourRect,
): PcbNoteLine[] => {
  const rectangleTransform =
    copperPour.shape === "rect"
      ? compose(
          translate(copperPour.center.x, copperPour.center.y),
          rotateDEG(copperPour.rotation ?? 0),
        )
      : undefined
  const boundaryRings =
    copperPour.shape === "brep"
      ? [
          copperPour.brep_shape.outer_ring.vertices,
          ...copperPour.brep_shape.inner_rings.map((hole) => hole.vertices),
        ]
      : [
          [
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
          ].map(([x, y]) =>
            applyToPoint(rectangleTransform!, {
              x: (x * copperPour.width) / 2,
              y: (y * copperPour.height) / 2,
            }),
          ),
        ]
  return boundaryRings.flatMap((boundary, ringIndex) =>
    boundary.map((start, edgeIndex) => {
      const end = boundary[(edgeIndex + 1) % boundary.length]
      return {
        type: "pcb_note_line",
        pcb_note_line_id: `boundary_${ringIndex}_${edgeIndex}`,
        layer: "top",
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
        stroke_width: 0.06,
        color: "#64748b",
      }
    }),
  )
}

test("copper-pour trace visibility across boundary cases", async () => {
  const rotatedRectangle: PcbCopperPourRect = {
    type: "pcb_copper_pour",
    pcb_copper_pour_id: "pour",
    source_net_id: "gnd",
    shape: "rect",
    layer: "top",
    covered_with_solder_mask: false,
    center: { x: 5, y: 5 },
    width: 8,
    height: 1,
    rotation: 45,
  }
  const cases: {
    name: string
    route: PcbTrace["route"]
    copperPour: PcbCopperPourBRep | PcbCopperPourRect
    hidden: boolean[]
    otherNet?: boolean
  }[] = [
    {
      name: "Narrow hole",
      route: [wire(1, 5), wire(9, 5)],
      copperPour: pour(square, [
        [
          [3.1, 4.9],
          [3.3, 4.9],
          [3.3, 5.1],
          [3.1, 5.1],
        ],
      ]),
      hidden: [false],
    },
    {
      name: "Covered neighbours",
      route: [wire(1, 5), wire(3, 5), wire(7, 5), wire(9, 5)],
      copperPour: pour(square, [
        [
          [4, 4],
          [6, 4],
          [6, 6],
          [4, 6],
        ],
      ]),
      hidden: [false, false, false],
    },
    {
      name: "Fully inside pour",
      route: [wire(1, 5), wire(9, 5)],
      copperPour: pour(),
      hidden: [true],
    },
    {
      name: "Rotated rect / inside",
      route: [wire(3, 3), wire(7, 7)],
      copperPour: rotatedRectangle,
      hidden: [true],
    },
    {
      name: "Rotated rect / outside",
      route: [wire(3, 7), wire(7, 3)],
      copperPour: rotatedRectangle,
      hidden: [false],
    },
    {
      name: "Different net",
      route: [wire(1, 5), wire(9, 5)],
      copperPour: pour(),
      hidden: [false],
      otherNet: true,
    },
    {
      name: "Different layer",
      route: [wire(1, 5, "bottom"), wire(9, 5, "bottom")],
      copperPour: pour(),
      hidden: [false],
    },
    {
      name: "Repeated ring vertex",
      route: [wire(11, 5), wire(12, 5)],
      copperPour: pour([...square, square[0]]),
      hidden: [false],
    },
    {
      name: "Zero-length wire",
      route: [wire(1, 5), wire(1, 5)],
      copperPour: pour(),
      hidden: [false],
    },
    {
      name: "Via transition",
      route: [
        wire(1, 5),
        {
          route_type: "via",
          x: 1,
          y: 5,
          from_layer: "top",
          to_layer: "bottom",
        },
        wire(1, 5, "bottom"),
      ],
      copperPour: pour(),
      hidden: [false, false],
    },
  ]
  const panels: string[] = []
  for (const scenario of cases) {
    const sourceTrace: SourceTrace = {
      type: "source_trace",
      source_trace_id: "supply_trace",
      connected_source_port_ids: [],
      connected_source_net_ids: [scenario.otherNet ? "vbus" : "gnd"],
    }
    const trace: PcbTrace = {
      type: "pcb_trace",
      pcb_trace_id: "trace",
      source_trace_id: sourceTrace.source_trace_id,
      route: structuredClone(scenario.route),
    }
    const db = su([sourceTrace, trace, structuredClone(scenario.copperPour)])
    markTraceSegmentsInsideCopperPour({ db, copperPour: scenario.copperPour })
    const annotatedRoute = db.pcb_trace.get("trace")!.route
    const hiddenSegments = annotatedRoute
      .slice(0, -1)
      .map((start, segmentIndex) => {
        const end = annotatedRoute[segmentIndex + 1]
        return (
          start.route_type === "wire" &&
          end.route_type === "wire" &&
          start.is_inside_copper_pour === true &&
          end.is_inside_copper_pour === true
        )
      })
    // This branch records existing visibility, including the known false flags.
    // The dependent fix adds assertions against the expected visibility.
    // The annotation operation must preserve every physical route field.
    const unannotatedRoute = annotatedRoute.map((routePoint) => {
      if (routePoint.route_type !== "wire" && routePoint.route_type !== "via")
        return routePoint
      const { is_inside_copper_pour, copper_pour_id, ...physicalRoutePoint } =
        routePoint
      return physicalRoutePoint
    })
    expect(unannotatedRoute, scenario.name).toEqual(scenario.route)

    // Show the actual flags with fills hidden, as in the reported PCB view.
    // Boundary notes explain the geometry without masking another net/layer.
    const svg = convertCircuitJsonToPcbSvg(
      [
        ...db.toArray().filter((element) => element.type !== "pcb_copper_pour"),
        ...getPourBoundaryNotes(scenario.copperPour),
      ],
      {
        width: 420,
        height: 320,
        includeVersion: false,
        viewport: { minX: -1, maxX: 13, minY: -1, maxY: 11 },
      },
    )
    const correctVisibility = hiddenSegments.every(
      (hidden, segmentIndex) => hidden === scenario.hidden[segmentIndex],
    )
    const description = !correctVisibility
      ? "BUG: exposed wire is hidden"
      : hiddenSegments.some(Boolean)
        ? "Covered: may hide wire"
        : "Visible: must not hide wire"
    const caption = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="78">
      <rect width="420" height="78" fill="#172131" />
      <text x="12" y="28" fill="white" font-size="17">${scenario.name}</text>
      <text x="12" y="57" fill="#cbd5e1" font-size="13">${description}</text>
    </svg>`
    const clippedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="320">${svg.replace("<svg ", '<svg overflow="hidden" ')}</svg>`
    panels.push(
      stackSvgsVertically([caption, clippedSvg], {
        gap: 0,
        normalizeSize: false,
      }),
    )
  }
  const rows = [panels.slice(0, 5), panels.slice(5)].map((row) =>
    stackSvgsHorizontally(row, { gap: 12, normalizeSize: false }),
  )
  await expect(
    stackSvgsVertically(rows, { gap: 12, normalizeSize: false }),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})
