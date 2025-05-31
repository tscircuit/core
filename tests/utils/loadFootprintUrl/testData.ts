// Common test data for loadFootprintUrl tests
export const singlePadTestData = [
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad1",
    shape: "rect",
    x: 0,
    y: 0,
    width: 1,
    height: 0.5,
    layer: "top",
    port_hints: ["pin1", "1"],
  },
]

export const dualPadTestData = [
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad1",
    shape: "rect",
    x: 0,
    y: 0,
    width: 1,
    height: 0.5,
    layer: "top",
    port_hints: ["pin1", "1"],
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad2",
    shape: "rect",
    x: 2,
    y: 0,
    width: 1,
    height: 0.5,
    layer: "top",
    port_hints: ["pin2", "2"],
  },
]