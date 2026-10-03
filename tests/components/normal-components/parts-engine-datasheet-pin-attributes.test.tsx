import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement, SourcePort } from "circuit-json"
import type { Port } from "lib/components/primitive-components/Port"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"

test("supplier imports retain datasheet attributes and explicit user overrides without changing props", async () => {
  const { circuit } = getTestFixture()
  const importedPorts: SourcePort[] = [
    {
      type: "source_port",
      source_port_id: "imported_supply",
      source_component_id: "generic_0",
      name: "pin1",
      pin_number: 1,
      port_hints: ["1", "pin1", "AVCC"],
      requires_power: true,
      requires_voltage: 2.8,
      is_input: false,
      is_bidirectional: true,
      is_gpio: false,
      can_use_open_drain: true,
      supports_i2c_sda: true,
      is_configured_for_i2c_sda: false,
      must_be_connected: true,
    },
    {
      type: "source_port",
      source_port_id: "imported_ground",
      source_component_id: "generic_0",
      name: "pin2",
      pin_number: 2,
      port_hints: ["2", "pin2", "RETURN"],
      requires_ground: true,
      provides_voltage: 0,
    },
  ]
  const importedCircuitJson = [
    ...external0402Footprint,
    ...importedPorts,
  ] as AnyCircuitElement[]
  const capturedCircuitJson = structuredClone(importedCircuitJson)
  let imports = 0
  const engine: PartsEngine = {
    findPart: async () => ({}),
    fetchPartCircuitJson: async (request) => {
      expect(request).toMatchObject({
        includeDatasheetInformation: true,
        manufacturerPartNumber:
          request.supplierPartNumber === "C_AVCC"
            ? "F1C-AVCC"
            : "USER-OVERRIDE",
      })
      imports++
      return importedCircuitJson
    },
  }
  const pinAttributes = {
    pin1: {
      requiresPower: false,
      requiresVoltage: 0,
      mustBeConnected: false,
      capabilities: [],
      activeCapabilities: [],
    },
    pin2: { requiresGround: false },
  }
  const capturedPinAttributes = structuredClone(pinAttributes)
  circuit.add(
    <board width="20mm" height="10mm" partsEngine={engine} routingDisabled>
      <chip
        name="U1"
        manufacturerPartNumber="F1C-AVCC"
        supplierPartNumbers={{ jlcpcb: ["C_AVCC"] }}
        footprint="jlcpcb:C_AVCC"
        pcbX={-3}
        pinLabels={{ pin1: "AVCC", pin2: "RETURN" }}
      />
      <chip
        name="U2"
        manufacturerPartNumber="USER-OVERRIDE"
        supplierPartNumbers={{ jlcpcb: ["C_OVERRIDE"] }}
        footprint="jlcpcb:C_OVERRIDE"
        pcbX={3}
        pinLabels={{ pin1: "AVCC", pin2: "RETURN" }}
        pinAttributes={pinAttributes}
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        pcbX={-3}
        pcbY={2}
      />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="0402"
        pcbX={3}
        pcbY={2}
      />
      <trace from=".C1 > .pin1" to=".U1 > .AVCC" />
      <trace from=".C1 > .pin2" to=".U1 > .RETURN" />
      <trace from=".C2 > .pin1" to=".U2 > .AVCC" />
      <trace from=".C2 > .pin2" to=".U2 > .RETURN" />
      <pcbnotetext
        pcbY={-3}
        text="AVCC: 2.8V imported; U2 overrides to 0V"
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(imports).toBe(2)
  const portsFor = (name: string) => {
    const chip = circuit.db.source_component
      .list()
      .find((chip) => chip.name === name)!
    return circuit.db.source_port
      .list()
      .filter((port) => port.source_component_id === chip.source_component_id)
  }
  const imported = portsFor("U1")
  expect(imported).toHaveLength(2)
  expect(imported.find((port) => port.pin_number === 1)).toMatchObject({
    requires_power: true,
    requires_voltage: 2.8,
    is_input: false,
    is_bidirectional: true,
    is_gpio: false,
    can_use_open_drain: true,
    supports_i2c_sda: true,
    is_configured_for_i2c_sda: false,
    must_be_connected: true,
  })
  expect(imported.find((port) => port.pin_number === 2)).toMatchObject({
    requires_ground: true,
    provides_voltage: 0,
  })
  const overridden = portsFor("U2")
  expect(overridden.find((port) => port.pin_number === 1)).toMatchObject({
    requires_power: false,
    requires_voltage: 0,
    must_be_connected: false,
    is_bidirectional: true,
  })
  expect(overridden.find((port) => port.pin_number === 1)).not.toHaveProperty(
    "supports_i2c_sda",
  )
  expect(overridden.find((port) => port.pin_number === 1)).not.toHaveProperty(
    "is_configured_for_i2c_sda",
  )
  expect(overridden.find((port) => port.pin_number === 2)).toMatchObject({
    requires_ground: false,
    provides_voltage: 0,
  })
  expect(importedCircuitJson).toEqual(capturedCircuitJson)
  expect(pinAttributes).toEqual(capturedPinAttributes)
  expect((circuit.selectOne(".C1 > .pin1") as Port).isConnectedToPower()).toBe(
    true,
  )
  expect((circuit.selectOne(".C1 > .pin2") as Port).isConnectedToGround()).toBe(
    true,
  )
  expect((circuit.selectOne(".C2 > .pin1") as Port).isConnectedToPower()).toBe(
    false,
  )
  expect((circuit.selectOne(".C2 > .pin2") as Port).isConnectedToGround()).toBe(
    false,
  )
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(8)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
