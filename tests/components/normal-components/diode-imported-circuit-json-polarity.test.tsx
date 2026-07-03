import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const importedDiodeCircuitJson = [
  {
    type: "source_component",
    ftype: "simple_diode",
    source_component_id: "source_component_d1",
    name: "D1",
  },
  {
    type: "source_port",
    source_port_id: "source_port_d1_k",
    source_component_id: "source_component_d1",
    name: "K",
    pin_number: 1,
    port_hints: ["K", "cathode"],
  },
  {
    type: "source_port",
    source_port_id: "source_port_d1_a",
    source_component_id: "source_component_d1",
    name: "A",
    pin_number: 2,
    port_hints: ["A", "anode"],
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_component_d1",
    source_component_id: "source_component_d1",
    center: { x: 0, y: 0 },
    width: 4,
    height: 2,
    layer: "top",
    rotation: 0,
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_d1_k",
    pcb_component_id: "pcb_component_d1",
    shape: "rect",
    x: -1,
    y: 0,
    width: 1,
    height: 1,
    layer: "top",
    port_hints: ["pin1"],
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_d1_a",
    pcb_component_id: "pcb_component_d1",
    shape: "rect",
    x: 1,
    y: 0,
    width: 1,
    height: 1,
    layer: "top",
    port_hints: ["pin2"],
  },
  {
    type: "pcb_note_text",
    pcb_note_text_id: "pcb_note_text_diode_import_polarity",
    pcb_component_id: null,
    text: "Imported diode: pin1=K/cathode, pin2=A/anode",
    anchor_position: { x: 0, y: 2 },
    anchor_alignment: "center",
    font_size: 0.35,
    color: "#444",
  },
] as AnyCircuitElement[]

test("imported diode circuit json maps A/K source ports to anode/cathode selectors", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" circuitJson={importedDiodeCircuitJson} />,
  )
  circuit.render()

  const diode = circuit.selectOne(".D1") as any
  expect(diode.cathode.props.pinNumber).toBe(1)
  expect(diode.neg.props.pinNumber).toBe(1)
  expect(diode.anode.props.pinNumber).toBe(2)
  expect(diode.pos.props.pinNumber).toBe(2)

  const sourcePorts = circuit.db.source_port
    .list()
    .filter((port) => port.source_component_id === diode.source_component_id)
  const pin1 = sourcePorts.find((port) => port.pin_number === 1)
  const pin2 = sourcePorts.find((port) => port.pin_number === 2)

  expect(pin1?.port_hints).toContain("K")
  expect(pin1?.port_hints).toContain("cathode")
  expect(pin1?.port_hints).toContain("neg")
  expect(pin1?.port_hints).not.toContain("anode")
  expect(pin1?.port_hints).not.toContain("pos")

  expect(pin2?.port_hints).toContain("A")
  expect(pin2?.port_hints).toContain("anode")
  expect(pin2?.port_hints).toContain("pos")
  expect(pin2?.port_hints).not.toContain("cathode")
  expect(pin2?.port_hints).not.toContain("neg")

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
