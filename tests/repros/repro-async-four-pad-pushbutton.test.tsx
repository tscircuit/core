import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const fourPadPushbuttonFootprint = [
  {
    type: "source_component",
    source_component_id: "generic_0",
    supplier_part_numbers: {},
  },
  {
    type: "pcb_component",
    source_component_id: "generic_0",
    pcb_component_id: "pcb_generic_component_0",
    layer: "top",
    center: { x: 0, y: 0 },
    rotation: 0,
    width: 5.2,
    height: 2.8,
  },
  ...[
    { id: 0, x: -2.075, y: 1.075, pin: "1" },
    { id: 1, x: 2.075, y: 1.075, pin: "1" },
    { id: 2, x: -2.075, y: -1.075, pin: "2" },
    { id: 3, x: 2.075, y: -1.075, pin: "2" },
  ].map(({ id, x, y, pin }) => ({
    type: "pcb_smtpad",
    pcb_smtpad_id: `pcb_smtpad_${id}`,
    pcb_component_id: "pcb_generic_component_0",
    shape: "rect",
    layer: "top",
    x,
    y,
    width: 1.05,
    height: 0.65,
    port_hints: [pin],
  })),
]

test("async four-pad pushbutton footprint attaches every pad to a port", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async () => ({
          footprintCircuitJson: fourPadPushbuttonFootprint,
        }),
      },
    },
  })

  circuit.add(
    <board width="20mm" height="12mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0603"
        pcbX={-5}
        pcbY={2}
        connections={{ pin1: "net.VCC", pin2: "net.SIGNAL" }}
      />
      <pushbutton
        name="SW1"
        footprint="kicad:Button_Switch_SMD/SW_SPST_PTS810"
        connections={{ pin1: "net.SIGNAL", pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0603"
        pcbX={5}
        pcbY={-2}
        connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
