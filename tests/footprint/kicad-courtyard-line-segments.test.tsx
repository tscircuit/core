import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const sot223WithFourCourtyardLineSegments = [
  {
    type: "source_component",
    source_component_id: "source_component_0",
    name: "U1",
    ftype: "simple_chip",
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_component_0",
    source_component_id: "source_component_0",
    center: { x: 0, y: 0 },
    layer: "top",
    rotation: 0,
    width: 7.6,
    height: 7.4,
  },
  {
    type: "source_port",
    source_port_id: "source_port_0",
    source_component_id: "source_component_0",
    name: "pin1",
    pin_number: 1,
    port_hints: ["1", "pin1"],
  },
  {
    type: "source_port",
    source_port_id: "source_port_1",
    source_component_id: "source_component_0",
    name: "pin2",
    pin_number: 2,
    port_hints: ["2", "pin2"],
  },
  {
    type: "source_port",
    source_port_id: "source_port_2",
    source_component_id: "source_component_0",
    name: "pin3",
    pin_number: 3,
    port_hints: ["3", "pin3"],
  },
  {
    type: "pcb_port",
    pcb_port_id: "pcb_port_0",
    pcb_component_id: "pcb_component_0",
    source_port_id: "source_port_0",
    x: -3.15,
    y: -2.3,
    layers: ["top"],
  },
  {
    type: "pcb_port",
    pcb_port_id: "pcb_port_1",
    pcb_component_id: "pcb_component_0",
    source_port_id: "source_port_1",
    x: -3.15,
    y: 0,
    layers: ["top"],
  },
  {
    type: "pcb_port",
    pcb_port_id: "pcb_port_2",
    pcb_component_id: "pcb_component_0",
    source_port_id: "source_port_2",
    x: -3.15,
    y: 2.3,
    layers: ["top"],
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_0",
    pcb_component_id: "pcb_component_0",
    pcb_port_id: "pcb_port_0",
    layer: "top",
    shape: "rect",
    width: 1.5,
    height: 1.0,
    x: -3.15,
    y: -2.3,
    port_hints: ["1", "pin1"],
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_1",
    pcb_component_id: "pcb_component_0",
    pcb_port_id: "pcb_port_1",
    layer: "top",
    shape: "rect",
    width: 1.5,
    height: 1.0,
    x: -3.15,
    y: 0,
    port_hints: ["2", "pin2"],
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_2",
    pcb_component_id: "pcb_component_0",
    pcb_port_id: "pcb_port_2",
    layer: "top",
    shape: "rect",
    width: 1.5,
    height: 1.0,
    x: -3.15,
    y: 2.3,
    port_hints: ["3", "pin3"],
  },
  {
    type: "pcb_courtyard_outline",
    pcb_courtyard_outline_id: "pcb_courtyard_outline_0",
    pcb_component_id: "pcb_component_0",
    layer: "top",
    outline: [
      { x: -4.15, y: -3.7 },
      { x: 4.15, y: -3.7 },
    ],
  },
  {
    type: "pcb_courtyard_outline",
    pcb_courtyard_outline_id: "pcb_courtyard_outline_1",
    pcb_component_id: "pcb_component_0",
    layer: "top",
    outline: [
      { x: 4.15, y: -3.7 },
      { x: 4.15, y: 3.7 },
    ],
  },
  {
    type: "pcb_courtyard_outline",
    pcb_courtyard_outline_id: "pcb_courtyard_outline_2",
    pcb_component_id: "pcb_component_0",
    layer: "top",
    outline: [
      { x: 4.15, y: 3.7 },
      { x: -4.15, y: 3.7 },
    ],
  },
  {
    type: "pcb_courtyard_outline",
    pcb_courtyard_outline_id: "pcb_courtyard_outline_3",
    pcb_component_id: "pcb_component_0",
    layer: "top",
    outline: [
      { x: -4.15, y: 3.7 },
      { x: -4.15, y: -3.7 },
    ],
  },
]

test("KiCad footprints with four courtyard line segments stitch into a closed courtyard and do not skip autorouting", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async () => ({
          footprintCircuitJson: sot223WithFourCourtyardLineSegments,
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

  const circuitJson = circuit.getCircuitJson()
  const courtyardOutlines = circuitJson.filter(
    (el) => el.type === "pcb_courtyard_outline",
  )
  expect(courtyardOutlines).toHaveLength(1)
  expect(courtyardOutlines[0]!.outline).toHaveLength(4)

  const autoroutingErrors = circuitJson.filter(
    (el) => el.type === "pcb_autorouting_error",
  )
  expect(autoroutingErrors).toHaveLength(0)

  const pcbTraces = circuitJson.filter((el) => el.type === "pcb_trace")
  expect(pcbTraces.length).toBeGreaterThanOrEqual(2)
})

test("Stitched KiCad courtyard line segments still participate in courtyard overlap DRC and ignore stray open crosshair segments", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async () => ({
          footprintCircuitJson: [
            ...sot223WithFourCourtyardLineSegments,
            {
              type: "pcb_courtyard_outline",
              pcb_courtyard_outline_id: "pcb_courtyard_outline_crosshair_h",
              pcb_component_id: "pcb_component_0",
              layer: "top",
              outline: [
                { x: -0.5, y: 0 },
                { x: 0.5, y: 0 },
              ],
            },
          ],
        }),
      },
    },
  })

  circuit.add(
    <board width="30mm" height="20mm">
      <chip
        name="U1"
        footprint="kicad:Package_TO_SOT_SMD/SOT-223-3_TabPin2"
        pcbX={0}
        pcbY={0}
      />
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={3} pcbY={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const courtyardOverlapErrors = circuitJson.filter(
    (el) => el.type === "pcb_courtyard_overlap_error",
  )
  expect(courtyardOverlapErrors.length).toBeGreaterThan(0)
})
