import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("KiCad footprints with courtyard as four 2-point line segments join into a closed courtyard and do not skip autorouting", async () => {
  const fourSegmentCourtyardFootprint = [
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_1",
      shape: "rect",
      layer: "top",
      x: -2.3,
      y: -3.15,
      width: 1.2,
      height: 2.0,
      port_hints: ["1", "pin1"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_2",
      shape: "rect",
      layer: "top",
      x: 0,
      y: -3.15,
      width: 1.2,
      height: 2.0,
      port_hints: ["2", "pin2"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_3",
      shape: "rect",
      layer: "top",
      x: 2.3,
      y: -3.15,
      width: 1.2,
      height: 2.0,
      port_hints: ["3", "pin3"],
    },
    {
      type: "pcb_courtyard_outline",
      pcb_courtyard_outline_id: "cy_top",
      pcb_component_id: "pcb_component_0",
      layer: "top",
      outline: [
        { x: -3.5, y: 4.4 },
        { x: 3.5, y: 4.4 },
      ],
    },
    {
      type: "pcb_courtyard_outline",
      pcb_courtyard_outline_id: "cy_right",
      pcb_component_id: "pcb_component_0",
      layer: "top",
      outline: [
        { x: 3.5, y: 4.4 },
        { x: 3.5, y: -4.4 },
      ],
    },
    {
      type: "pcb_courtyard_outline",
      pcb_courtyard_outline_id: "cy_bottom",
      pcb_component_id: "pcb_component_0",
      layer: "top",
      outline: [
        { x: 3.5, y: -4.4 },
        { x: -3.5, y: -4.4 },
      ],
    },
    {
      type: "pcb_courtyard_outline",
      pcb_courtyard_outline_id: "cy_left",
      pcb_component_id: "pcb_component_0",
      layer: "top",
      outline: [
        { x: -3.5, y: -4.4 },
        { x: -3.5, y: 4.4 },
      ],
    },
  ]

  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async () => ({
          footprintCircuitJson: fourSegmentCourtyardFootprint,
        }),
      },
    },
  })

  circuit.add(
    <board width="30mm" height="20mm">
      <chip
        name="U1"
        footprint="kicad:Package_TO_SOT_SMD/SOT-223-3_TabPin2"
        pinLabels={{ pin1: "IN", pin2: "GND", pin3: "OUT" }}
        pcbX={-7}
        pcbY={0}
      />
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={8} pcbY={0} />
      <trace name="A" from=".U1 > .OUT" to=".R1 > .pin1" />
      <trace name="B" from=".R1 > .pin2" to=".U1 > .GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const courtyardOutlines = circuit.db.pcb_courtyard_outline.list()
  expect(courtyardOutlines).toHaveLength(1)
  expect(courtyardOutlines[0]!.outline).toHaveLength(4)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
})
