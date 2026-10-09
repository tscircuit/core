import { fp } from "@tscircuit/footprinter"
import type { AnyCircuitElement } from "circuit-json"

export const CourtyardTestFootprint = () => (
  <footprint>
    <smtpad
      portHints={["1"]}
      pcbX={-0.51}
      width={0.54}
      height={0.64}
      shape="rect"
    />
    <smtpad
      portHints={["2"]}
      pcbX={0.51}
      width={0.54}
      height={0.64}
      shape="rect"
    />
    <courtyardrect width={6} height={4} />
    <courtyardcircle radius={2} />
    <courtyardoutline
      outline={[
        { x: -3, y: -2 },
        { x: 3, y: -2 },
        { x: 3, y: 2 },
        { x: -3, y: 2 },
      ]}
    />
  </footprint>
)

export const getCourtyardTestFootprintCircuitJson = (): AnyCircuitElement[] => [
  ...(fp
    .string("cap0402")
    .circuitJson()
    .filter(
      (elm) => !elm.type.startsWith("pcb_courtyard_"),
    ) as AnyCircuitElement[]),
  {
    type: "pcb_courtyard_rect",
    pcb_courtyard_rect_id: "default_rect",
    pcb_component_id: "default_part",
    center: { x: 0, y: 0 },
    width: 6,
    height: 4,
    layer: "top",
  },
  {
    type: "pcb_courtyard_circle",
    pcb_courtyard_circle_id: "default_circle",
    pcb_component_id: "default_part",
    center: { x: 0, y: 0 },
    radius: 2,
    layer: "top",
  },
  {
    type: "pcb_courtyard_outline",
    pcb_courtyard_outline_id: "default_outline",
    pcb_component_id: "default_part",
    layer: "top",
    outline: [
      { x: -3, y: -2 },
      { x: 3, y: -2 },
      { x: 3, y: 2 },
      { x: -3, y: 2 },
    ],
  },
]
