import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const kicadSmdSwitchWithDuplicatePads = [
  {
    type: "pcb_component",
    pcb_component_id: "pcb_component_0",
    source_component_id: "source_component_0",
    layer: "top",
    center: { x: 0, y: 0 },
    rotation: 0,
    width: 4.6,
    height: 2.6,
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_1a",
    pcb_component_id: "pcb_component_0",
    shape: "rect",
    x: -1.6,
    y: 0.75,
    width: 1,
    height: 0.7,
    layer: "top",
    port_hints: ["1"],
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_1b",
    pcb_component_id: "pcb_component_0",
    shape: "rect",
    x: -1.6,
    y: -0.75,
    width: 1,
    height: 0.7,
    layer: "top",
    port_hints: ["1"],
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_2a",
    pcb_component_id: "pcb_component_0",
    shape: "rect",
    x: 1.6,
    y: 0.75,
    width: 1,
    height: 0.7,
    layer: "top",
    port_hints: ["2"],
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_2b",
    pcb_component_id: "pcb_component_0",
    shape: "rect",
    x: 1.6,
    y: -0.75,
    width: 1,
    height: 0.7,
    layer: "top",
    port_hints: ["2"],
  },
] as any[]

test("repro114 KiCad SMD switch duplicate pad numbers are not split into routable physical ports", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async () => ({
          footprintCircuitJson: kicadSmdSwitchWithDuplicatePads,
        }),
      },
    },
  })

  circuit.add(
    <board width="12mm" height="8mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
      <pushbutton
        name="SW1"
        footprint="kicad:Button_Switch_SMD/SW_SPST_EVQP2"
        pcbX={0}
        pcbY={0}
      />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
      <trace from=".R1 .pin2" to=".SW1 .pin1" />
      <trace from=".SW1 .pin2" to=".R2 .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const swSourceComponent = circuit.db.source_component
    .list()
    .find((component) => component.name === "SW1")
  const swPcbComponent = circuit.db.pcb_component
    .list()
    .find(
      (component) =>
        component.source_component_id ===
        swSourceComponent?.source_component_id,
    )
  const pads = circuit.db.pcb_smtpad
    .list()
    .filter((pad) => pad.pcb_component_id === swPcbComponent?.pcb_component_id)
  const ports = circuit.db.pcb_port
    .list()
    .filter(
      (port) => port.pcb_component_id === swPcbComponent?.pcb_component_id,
    )

  expect(pads.map((pad) => pad.port_hints?.join(","))).toEqual([
    "1",
    "1",
    "2",
    "2",
  ])
  expect(pads.every((pad) => pad.pcb_port_id === null)).toBe(true)
  expect(ports).toHaveLength(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
})
