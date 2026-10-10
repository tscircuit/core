import { expect } from "bun:test"
import type { AnyCircuitElement, LayerRef, PcbSmtPadCircle } from "circuit-json"
import type { RootCircuit } from "lib/RootCircuit"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

/**
 * Footprint-local points in mm, +X right/+Y top, right-handed with +Z above.
 * Pads mark the keepout center and four corners so expectations come from
 * emitted board-world geometry rather than repeating Core's transform.
 */
export const importedKeepoutFootprint: AnyCircuitElement[] = [
  ...[
    [1.3, 2.1],
    [-0.7, 1.1],
    [3.3, 1.1],
    [3.3, 3.1],
    [-0.7, 3.1],
    [-2, -1],
  ].map(
    ([x, y], pinIndex): PcbSmtPadCircle => ({
      type: "pcb_smtpad",
      pcb_smtpad_id: "",
      pcb_component_id: "",
      pcb_port_id: "",
      shape: "circle",
      x,
      y,
      radius: 0.09,
      layer: "top",
      port_hints: [String(pinIndex + 1)],
    }),
  ),
  {
    type: "pcb_keepout",
    pcb_keepout_id: "",
    shape: "rect",
    center: { x: 1.3, y: 2.1 },
    width: 4,
    height: 2,
    layers: ["top"],
    allow_traces: false,
    allow_placements: true,
    warning_only: false,
  },
  {
    type: "pcb_keepout",
    pcb_keepout_id: "",
    shape: "circle",
    center: { x: -2, y: -1 },
    radius: 0.65,
    layers: ["top"],
    allow_traces: false,
    allow_placements: true,
    warning_only: false,
  },
]

export const KeepoutTransformChip = ({
  name,
  pcbX,
  pcbY = 0,
  pcbRotation,
  layer,
}: {
  name: string
  pcbX: number
  pcbY?: number
  pcbRotation: number
  layer: "top" | "bottom"
}) => (
  <chip
    name={name}
    pcbX={pcbX}
    pcbY={pcbY}
    pcbRotation={pcbRotation}
    layer={layer}
    cadModel={null}
    footprint={importedKeepoutFootprint}
    pinLabels={{
      pin1: ["center"],
      pin2: ["corner1"],
      pin3: ["corner2"],
      pin4: ["corner3"],
      pin5: ["corner4"],
      pin6: ["circle_center"],
    }}
  />
)

export function expectKeepoutMatchesEmittedPads(
  circuit: RootCircuit,
  name: string,
  layer: LayerRef,
) {
  const sourceComponent = circuit.db.source_component
    .list()
    .find((c) => c.name === name)!
  const sourcePorts = circuit.db.source_port
    .list()
    .filter(
      (p) => p.source_component_id === sourceComponent.source_component_id,
    )
  const pcbPorts = circuit.db.pcb_port.list()
  const pads = circuit.db.pcb_smtpad.list()
  const marker = (pin: number) => {
    const sourcePort = sourcePorts.find((p) => p.pin_number === pin)!
    const pcbPort = pcbPorts.find(
      (p) => p.source_port_id === sourcePort.source_port_id,
    )!
    const pad = pads.find((p) => p.pcb_port_id === pcbPort.pcb_port_id)!
    expect(pad.shape).toBe("circle")
    return pad as PcbSmtPadCircle
  }
  const center = marker(1)
  const corners = [2, 3, 4, 5].map(marker)
  const rectangle = circuit.db.pcb_keepout
    .list()
    .find(
      (k) =>
        k.shape === "rect" &&
        Math.abs(k.center.x - center.x) < 1e-6 &&
        Math.abs(k.center.y - center.y) < 1e-6,
    )!
  expect(rectangle.shape).toBe("rect")
  if (rectangle.shape !== "rect") throw new Error("Expected rectangle keepout")
  expect(rectangle.layers).toEqual([layer])
  expect(center.layer).toBe(layer)
  expect(rectangle.width).toBeCloseTo(
    Math.max(...corners.map((p) => p.x)) - Math.min(...corners.map((p) => p.x)),
    10,
  )
  expect(rectangle.height).toBeCloseTo(
    Math.max(...corners.map((p) => p.y)) - Math.min(...corners.map((p) => p.y)),
    10,
  )
  for (const corner of corners) {
    expect(Math.abs(corner.x - rectangle.center.x)).toBeLessThanOrEqual(
      rectangle.width / 2 + 1e-9,
    )
    expect(Math.abs(corner.y - rectangle.center.y)).toBeLessThanOrEqual(
      rectangle.height / 2 + 1e-9,
    )
  }
  const circleCenter = marker(6)
  const circle = circuit.db.pcb_keepout
    .list()
    .find(
      (k) =>
        k.shape === "circle" &&
        Math.abs(k.center.x - circleCenter.x) < 1e-6 &&
        Math.abs(k.center.y - circleCenter.y) < 1e-6,
    )!
  expect(circle).toMatchObject({
    shape: "circle",
    radius: 0.65,
    layers: [layer],
  })
  for (const keepout of [rectangle, circle]) {
    expect(keepout).toMatchObject({
      allow_traces: false,
      allow_placements: true,
      warning_only: false,
    })
  }
  // These are the actual obstacle records consumed by getSimpleRouteJson.
  expect(getObstaclesFromCircuitJson([rectangle, circle])).toMatchObject([
    {
      layers: [layer],
      center: rectangle.center,
      width: rectangle.width,
      height: rectangle.height,
    },
    { layers: [layer], center: circle.center, width: 1.3, height: 1.3 },
  ])
}
