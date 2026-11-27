import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import type { Led } from "lib/components/normal-components/Led"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const createSupplierLedCircuitJson = (
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

test("plain <led> adopts cathode-first supplier part polarity and routes .anode/.cathode cleanly", async () => {
  let findPartCalls = 0
  let fetchPartCircuitJsonCalls = 0
  const partsEngine: PartsEngine = {
    findPart: ({ sourceComponent }) => {
      if (
        "ftype" in sourceComponent &&
        sourceComponent.ftype === "simple_led"
      ) {
        findPartCalls += 1
        return { jlcpcb: ["C3030991"] }
      }
      return {}
    },
    fetchPartCircuitJson: ({ supplierPartNumber }) => {
      expect(supplierPartNumber).toBe("C3030991")
      fetchPartCircuitJsonCalls += 1
      return createSupplierLedCircuitJson("cathode")
    },
  }

  const { circuit } = getTestFixture({
    platform: { partsEngine },
  })

  circuit.add(
    <board width="12mm" height="8mm">
      <resistor name="R1" resistance="330" footprint="0603" pcbX={-3} />
      <led name="D1" color="red" footprint="0603" pcbX={3} />
      <trace from="R1.pin2" to="D1.anode" />
      <trace from="R1.pin1" to="D1.cathode" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_component_misconfigured_error.list()).toEqual([])
  expect(findPartCalls).toBe(1)
  // Orientation analysis reuses the FetchPartFootprint lookup; footprint mismatch runs its own check.
  expect(fetchPartCircuitJsonCalls).toBe(2)

  const led = circuit.selectOne(".D1") as Led
  expect(led.cathode.props.pinNumber).toBe(1)
  expect(led.anode.props.pinNumber).toBe(2)

  const ledSource = circuit.db.source_component
    .list()
    .find((component) => component.name === "D1")!
  const ledPorts = circuit.db.source_port.list({
    source_component_id: ledSource.source_component_id,
  })
  const cathodePort = ledPorts.find((port) =>
    port.port_hints?.includes("cathode"),
  )!
  const anodePort = ledPorts.find((port) => port.port_hints?.includes("anode"))!
  expect(cathodePort.pin_number).toBe(1)
  expect(anodePort.pin_number).toBe(2)
  expect(cathodePort.port_hints).not.toContain("anode")
  expect(anodePort.port_hints).not.toContain("cathode")

  const cathodePcbPort = circuit.db.pcb_port
    .list()
    .find((port) => port.source_port_id === cathodePort.source_port_id)!
  const anodePcbPort = circuit.db.pcb_port
    .list()
    .find((port) => port.source_port_id === anodePort.source_port_id)!
  expect(cathodePcbPort.x).toBeLessThan(3)
  expect(anodePcbPort.x).toBeGreaterThan(3)

  const notes = circuit.db.pcb_fabrication_note_text.list({
    pcb_component_id: led.pcb_component_id!,
  })
  expect(notes).toHaveLength(2)
  expect(
    circuit.db.pcb_fabrication_note_path.list({
      pcb_component_id: led.pcb_component_id!,
    }),
  ).toHaveLength(4)
  const minusNote = notes.find((note) => note.text === "-")!
  const plusNote = notes.find((note) => note.text === "+")!
  expect(minusNote.anchor_position.x).toBeLessThan(plusNote.anchor_position.x)

  const cadComponent = circuit.db.cad_component
    .list()
    .find((cad) => cad.source_component_id === ledSource.source_component_id)!
  expect(cadComponent.footprinter_string).toContain("anodepin2_cathodepin1")
})

test("unnamed plain <led footprint='0603' color='red' /> builds without polarity errors", async () => {
  const partsEngine: PartsEngine = {
    findPart: () => ({ jlcpcb: ["C3030991"] }),
    fetchPartCircuitJson: () => createSupplierLedCircuitJson("cathode"),
  }
  const { circuit } = getTestFixture({
    platform: { partsEngine },
  })

  const unnamedLedProps = { footprint: "0603", color: "red" } as any
  circuit.add(
    <board width="12mm" height="8mm">
      <led {...unnamedLedProps} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_component_misconfigured_error.list()).toEqual([])
})

test("explicit LED polarity via pinLabels or footprint options still reports supplier polarity mismatches", async () => {
  const partsEngine: PartsEngine = {
    findPart: () => ({ jlcpcb: ["C3030991"] }),
    fetchPartCircuitJson: () => createSupplierLedCircuitJson("cathode"),
  }
  const { circuit } = getTestFixture({
    platform: { partsEngine },
  })

  circuit.add(
    <board width="20mm" height="10mm">
      <led
        name="LED_PINLABELS"
        color="red"
        footprint="0603"
        pcbX={-4}
        pinLabels={{ pin1: ["anode", "pos"], pin2: ["cathode", "neg"] }}
      />
      <led
        name="LED_FOOTPRINT"
        color="red"
        footprint="led0603_anodepin1_cathodepin2"
        pcbX={4}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_component_misconfigured_error.list()
  expect(errors).toHaveLength(2)
})
