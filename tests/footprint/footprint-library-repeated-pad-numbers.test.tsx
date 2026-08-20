import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const repeatedPadNumberFootprint: AnyCircuitElement[] = [
  {
    type: "source_component",
    source_component_id: "source_component_0",
    ftype: "simple_push_button",
    name: "SW",
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_component_0",
    source_component_id: "source_component_0",
    center: { x: 0, y: 0 },
    width: 6,
    height: 4,
    layer: "top",
    rotation: 0,
    obstructs_within_bounds: true,
  },
  ...[
    { id: 0, x: -2, y: -1.5, pin: "1" },
    { id: 1, x: -2, y: 1.5, pin: "1" },
    { id: 2, x: 2, y: -1.5, pin: "2" },
    { id: 3, x: 2, y: 1.5, pin: "2" },
  ].map(
    ({ id, x, y, pin }): AnyCircuitElement => ({
      type: "pcb_smtpad",
      pcb_smtpad_id: `pcb_smtpad_${id}`,
      pcb_component_id: "pcb_component_0",
      shape: "rect",
      x,
      y,
      width: 1.2,
      height: 1,
      layer: "top",
      port_hints: [pin],
    }),
  ),
]

test("library footprint with separated pads that repeat pin numbers", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async () => ({
          footprintCircuitJson: repeatedPadNumberFootprint,
        }),
      },
    },
  })

  circuit.add(
    <board width="16mm" height="10mm">
      <pushbutton
        name="SW1"
        footprint="kicad:Button_Switch_SMD/SW_SPST_PTS810"
        connections={{ pin1: "net.LEFT", pin2: "net.RIGHT" }}
      />
      <pcbnotetext
        text="Each repeated KiCad pad number maps to a physical PCB port"
        pcbY={4}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pads = circuit.db.pcb_smtpad.list()
  expect(pads).toHaveLength(4)
  expect(pads.every((pad) => Boolean(pad.pcb_port_id))).toBe(true)
  expect(circuit.db.pcb_port.list()).toHaveLength(4)
  expect(circuit.db.source_component_internal_connection.list()).toHaveLength(2)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
