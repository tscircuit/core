import type { AnyCircuitElement } from "circuit-json"

export const createSupplierLedCircuitJson = (
  pin1Polarity: "anode" | "cathode" | "unknown",
): AnyCircuitElement[] => {
  const polarityHints =
    pin1Polarity === "anode"
      ? { pin1: "A", pin2: "K" }
      : pin1Polarity === "cathode"
        ? { pin1: "K", pin2: "A" }
        : { pin1: "1", pin2: "2" }

  return [
    {
      type: "source_port",
      source_port_id: "supplier_source_port_1",
      source_component_id: "supplier_source_component_1",
      name: "pin1",
      pin_number: 1,
      port_hints: [polarityHints.pin1],
    },
    {
      type: "source_port",
      source_port_id: "supplier_source_port_2",
      source_component_id: "supplier_source_component_1",
      name: "pin2",
      pin_number: 2,
      port_hints: [polarityHints.pin2],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "supplier_pad_1",
      shape: "rect",
      x: -0.825,
      y: 0,
      width: 0.8,
      height: 0.95,
      layer: "top",
      port_hints: ["pin1"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "supplier_pad_2",
      shape: "rect",
      x: 0.825,
      y: 0,
      width: 0.8,
      height: 0.95,
      layer: "top",
      port_hints: ["pin2"],
    },
  ] as AnyCircuitElement[]
}
