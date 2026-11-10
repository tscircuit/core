import { expect, test } from "bun:test"
import { su, transformPcbElements } from "@tscircuit/circuit-json-util"
import type {
  AnyCircuitElement,
  PcbCopperPourBRep,
  PcbCopperPourRect,
  PcbNotePath,
  PcbNoteText,
  PcbTrace,
  PcbTraceRoutePointWire,
  Point,
  SourceTrace,
} from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { markTraceSegmentsInsideCopperPour } from "lib/components/primitive-components/CopperPour/utils/mark-trace-segments-inside-copper-pour"
import { getTraceRouteWithoutPourAnnotations } from "tests/fixtures/get-trace-route-without-pour-annotations"
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

/** Render-only board-world points in mm: +X right, +Y up, +Z above (right handed). */
const getPourBoundaryNotes = (
  copperPour: PcbCopperPourBRep | PcbCopperPourRect,
  caseIndex: number,
): PcbNotePath[] => {
  let boundaries: Point[][]
  if (copperPour.shape === "brep") {
    boundaries = [
      copperPour.brep_shape.outer_ring.vertices,
      ...copperPour.brep_shape.inner_rings.map((hole) => hole.vertices),
    ]
  } else {
    const transform = compose(
      translate(copperPour.center.x, copperPour.center.y),
      rotateDEG(copperPour.rotation ?? 0),
    )
    boundaries = [
      [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ].map(([x, y]) =>
        applyToPoint(transform, {
          x: (x * copperPour.width) / 2,
          y: (y * copperPour.height) / 2,
        }),
      ),
    ]
  }
  return boundaries.map((boundary, ringIndex) => ({
    type: "pcb_note_path",
    pcb_note_path_id: `boundary_${caseIndex}_${ringIndex}`,
    layer: "top",
    route: [...boundary, boundary[0]].map(({ x, y }) => ({ x, y })),
    stroke_width: 0.06,
    color: "#64748b",
  }))
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
    connectedRoutes?: PcbTrace["route"][]
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
    {
      name: "Split trace neighbours",
      route: [wire(1, 5), wire(3, 5)],
      connectedRoutes: [
        [wire(3, 5), wire(7, 5)],
        [wire(7, 5), wire(9, 5)],
      ],
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
      name: "Covered split traces",
      route: [wire(1, 5), wire(3, 5)],
      connectedRoutes: [
        [wire(3, 5), wire(7, 5)],
        [wire(7, 5), wire(9, 5)],
      ],
      copperPour: pour(),
      hidden: [true, true, true],
    },
  ]
  const drawing: AnyCircuitElement[] = []
  for (const [caseIndex, scenario] of cases.entries()) {
    const routes = [scenario.route, ...(scenario.connectedRoutes ?? [])]
    const sourceTraces = routes.map(
      (_, traceIndex): SourceTrace => ({
        type: "source_trace",
        source_trace_id: `source_trace_${traceIndex}`,
        connected_source_port_ids: [],
        connected_source_net_ids: [scenario.otherNet ? "vbus" : "gnd"],
      }),
    )
    const traces = routes.map(
      (route, traceIndex): PcbTrace => ({
        type: "pcb_trace",
        pcb_trace_id: `trace_${traceIndex}`,
        source_trace_id: sourceTraces[traceIndex].source_trace_id,
        route: structuredClone(route),
      }),
    )
    const db = su([
      ...sourceTraces,
      ...traces,
      structuredClone(scenario.copperPour),
    ])
    markTraceSegmentsInsideCopperPour({ db, copperPour: scenario.copperPour })
    const annotatedTraces = db.pcb_trace.list()
    const hiddenSegments = annotatedTraces.flatMap(({ route }) =>
      route.slice(0, -1).map((start, segmentIndex) => {
        const end = route[segmentIndex + 1]
        return (
          start.route_type === "wire" &&
          end.route_type === "wire" &&
          start.is_inside_copper_pour === true &&
          end.is_inside_copper_pour === true
        )
      }),
    )
    // This branch records existing visibility, including the known false flags.
    // The dependent fix adds assertions against the expected visibility.
    // The annotation operation must preserve every physical route field.
    expect(
      annotatedTraces.map(({ route }) =>
        getTraceRouteWithoutPourAnnotations(route),
      ),
      scenario.name,
    ).toEqual(routes)

    const correctVisibility = hiddenSegments.every(
      (hidden, index) => hidden === scenario.hidden[index],
    )
    let description = "visible"
    if (!correctVisibility) description = "BUG: hidden"
    else if (hiddenSegments.some(Boolean)) description = "covered"
    const labels: PcbNoteText[] = [scenario.name, description].map(
      (text, line) => ({
        type: "pcb_note_text",
        pcb_note_text_id: `case_${caseIndex}_label_${line}`,
        layer: "top",
        font: "tscircuit2024",
        font_size: line === 0 ? 0.85 : 0.6,
        anchor_position: { x: 6, y: 12 - line * 0.95 },
        anchor_alignment: "center",
        color: "#cbd5e1",
        text,
      }),
    )
    // Translate rendering copies into a grid; all classification uses original points.
    const caseDrawing: AnyCircuitElement[] = [
      ...annotatedTraces.map((trace, traceIndex) => ({
        ...trace,
        pcb_trace_id: `case_${caseIndex}_trace_${traceIndex}`,
      })),
      ...getPourBoundaryNotes(scenario.copperPour, caseIndex),
      ...labels,
    ]
    drawing.push(
      ...transformPcbElements(
        structuredClone(caseDrawing),
        translate((caseIndex % 6) * 15, -Math.floor(caseIndex / 6) * 16),
      ),
    )
  }
  await expect(
    convertCircuitJsonToPcbSvg(drawing, {
      width: 1680,
      height: 570,
      includeVersion: false,
      viewport: { minX: -1, maxX: 88, minY: -17, maxY: 13 },
    }),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})
