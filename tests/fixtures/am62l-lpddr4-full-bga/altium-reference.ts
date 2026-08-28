import type { AnyCircuitElement, LayerRef } from "circuit-json"
import altiumReferenceData from "./altium-reference-data.json"

/**
 * Precomputed geometry extracted from the Texas Instruments TMDS62LEVM
 * SPRCAL9 Rev. B ODB++ output. The source board is
 * PROC181E1-1_PRJPCB.zip::PROC181E1-1_BRD_11_3.pcbdoc (SHA-256
 * 8444ad8456ff028b7aa11389362ba2fbc01291e87ff46e394576cb044c3612fc).
 *
 * The selected crop contains only the 33 AM62L-to-LPDDR4 nets used by this
 * comparison and the actual U28/U29 DGND pad, top-copper, pour, and via
 * geometry. Source coordinates are translated uniformly; no route geometry is
 * reshaped. See the data file's provenance and count records for the full
 * extraction manifest.
 */

const sourceLayerStack = [
  "top",
  "inner1",
  "inner2",
  "inner3",
  "inner4",
  "bottom",
] as const satisfies readonly LayerRef[]

type PadTuple = [
  referenceNumber: number,
  padName: string,
  netId: number,
  x: number,
  y: number,
  radius: number,
]
type SegmentTuple = [
  netId: number,
  layerIndex: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
]
type GroundSegmentTuple = [
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
]
type ViaTuple = [
  netId: number,
  x: number,
  y: number,
  outerDiameter: number,
  holeDiameter: number,
]
type GroundViaTuple = [
  x: number,
  y: number,
  outerDiameter: number,
  holeDiameter: number,
]

export const altiumReferenceViewport = altiumReferenceData.viewport

export const getAltiumReferenceCircuitJson = (): AnyCircuitElement[] => {
  const pads = (altiumReferenceData.pads as PadTuple[]).map(
    ([referenceNumber, padName, , x, y, radius], padIndex) => ({
      type: "pcb_smtpad" as const,
      shape: "circle" as const,
      pcb_smtpad_id: `pcb_smtpad_altium_u${referenceNumber}_${padName.toLowerCase()}_${padIndex}`,
      x,
      y,
      radius,
      layer: "top" as const,
    }),
  )

  const signalSegments = (
    altiumReferenceData.signalSegments as SegmentTuple[]
  ).map(([netId, layerIndex, x1, y1, x2, y2, width], segmentIndex) => ({
    type: "pcb_trace" as const,
    pcb_trace_id: `pcb_trace_altium_signal_${netId}_${segmentIndex}`,
    source_trace_id: `source_trace_altium_${netId}`,
    should_round_corners: false,
    route: [
      {
        route_type: "wire" as const,
        x: x1,
        y: y1,
        width,
        layer: sourceLayerStack[layerIndex]!,
      },
      {
        route_type: "wire" as const,
        x: x2,
        y: y2,
        width,
        layer: sourceLayerStack[layerIndex]!,
      },
    ],
  }))

  const groundSegments = (
    altiumReferenceData.groundSegments as GroundSegmentTuple[]
  ).map(([x1, y1, x2, y2, width], segmentIndex) => ({
    type: "pcb_trace" as const,
    pcb_trace_id: `pcb_trace_altium_dgnd_${segmentIndex}`,
    source_trace_id: "source_trace_altium_dgnd",
    should_round_corners: false,
    route: [
      {
        route_type: "wire" as const,
        x: x1,
        y: y1,
        width,
        layer: "top" as const,
      },
      {
        route_type: "wire" as const,
        x: x2,
        y: y2,
        width,
        layer: "top" as const,
      },
    ],
  }))

  const signalVias = (altiumReferenceData.signalVias as ViaTuple[]).map(
    ([netId, x, y, outerDiameter, holeDiameter], viaIndex) => ({
      type: "pcb_via" as const,
      pcb_via_id: `pcb_via_altium_signal_${netId}_${viaIndex}`,
      source_net_id: `source_net_altium_${netId}`,
      x,
      y,
      outer_diameter: outerDiameter,
      hole_diameter: holeDiameter,
      layers: [...sourceLayerStack],
    }),
  )

  const groundVias = (altiumReferenceData.groundVias as GroundViaTuple[]).map(
    ([x, y, outerDiameter, holeDiameter], viaIndex) => ({
      type: "pcb_via" as const,
      pcb_via_id: `pcb_via_altium_dgnd_${viaIndex}`,
      source_net_id: "source_net_altium_dgnd",
      x,
      y,
      outer_diameter: outerDiameter,
      hole_diameter: holeDiameter,
      layers: [...sourceLayerStack],
    }),
  )

  const groundSurfaces = altiumReferenceData.groundSurfaces.map(
    (surface, surfaceIndex) => ({
      type: "pcb_copper_pour" as const,
      pcb_copper_pour_id: `pcb_copper_pour_altium_dgnd_${surface.sourceFeatureId}_${surface.polygonIndex}_${surfaceIndex}`,
      source_net_id: "source_net_altium_dgnd",
      layer: "top" as const,
      shape: "brep" as const,
      covered_with_solder_mask: true,
      brep_shape: {
        outer_ring: {
          vertices: surface.outerRing.map(([x, y]) => ({ x, y })),
        },
        inner_rings: surface.innerRings.map((ring) => ({
          vertices: ring.map(([x, y]) => ({ x, y })),
        })),
      },
    }),
  )

  return [
    ...groundSurfaces,
    ...pads,
    ...signalSegments,
    ...groundSegments,
    ...signalVias,
    ...groundVias,
  ]
}
