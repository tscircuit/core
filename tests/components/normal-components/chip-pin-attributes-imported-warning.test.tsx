import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement, SourcePort } from "circuit-json"
import externalFootprint from "tests/fixtures/assets/external-0402-footprint.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("async imported attributes fill missing declarations and user overrides are validated", async () => {
  const importedPorts: SourcePort[] = [
    {
      type: "source_port",
      source_port_id: "imported_supply",
      source_component_id: "generic_0",
      name: "pin1",
      pin_number: 1,
      requires_power: true,
      requires_voltage: 3.3,
    },
    {
      type: "source_port",
      source_port_id: "imported_ground",
      source_component_id: "generic_0",
      name: "pin2",
      pin_number: 2,
      requires_ground: true,
      requires_voltage: 0,
    },
  ]
  const importedCircuitJson = [
    ...externalFootprint,
    ...importedPorts,
  ] as AnyCircuitElement[]
  const originalCircuitJson = structuredClone(importedCircuitJson)
  const partsEngine: PartsEngine = {
    findPart: async () => ({}),
    fetchPartCircuitJson: async () => {
      await Promise.resolve()
      return importedCircuitJson
    },
  }
  const { circuit } = getTestFixture()
  circuit.add(
    <board partsEngine={partsEngine} routingDisabled>
      <chip
        name="U1"
        footprint="jlcpcb:C_TEST"
        supplierPartNumbers={{ jlcpcb: ["C_TEST"] }}
        pinLabels={{ pin1: "VDD", pin2: "GND" }}
      />
      <chip
        name="U2"
        footprint="jlcpcb:C_TEST"
        supplierPartNumbers={{ jlcpcb: ["C_TEST"] }}
        pcbX={3}
        pinLabels={{ pin1: "VDD", pin2: "GND" }}
        pinAttributes={{ GND: { requiresVoltage: "1.8V" } }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const warnings =
    circuit.db.source_component_pins_underspecified_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0]!.message).toContain("Chip U2")
  expect(warnings[0]!.message).toContain(
    "GND (ground pin declares a nonzero voltage)",
  )
  expect(warnings[0]!.source_port_ids).toHaveLength(1)
  expect(importedCircuitJson).toEqual(originalCircuitJson)
})
