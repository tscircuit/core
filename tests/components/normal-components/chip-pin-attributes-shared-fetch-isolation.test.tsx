import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { DatasheetPartCircuitJsonRequest } from "lib/utils/fetch-part-circuit-json-with-datasheet"
import { getChipPinMetadataFixture } from "tests/fixtures/get-chip-pin-metadata-fixture"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("shared metadata fetches distinguish part identities and different parts engines", async () => {
  const highVoltage = getChipPinMetadataFixture([
    { requires_power: true, requires_voltage: 3.3 },
    { requires_ground: true },
  ]).importedCircuitJson
  const lowVoltage = getChipPinMetadataFixture([
    { requires_power: true, requires_voltage: 1.8 },
    { requires_ground: true },
  ]).importedCircuitJson
  const requestsA: DatasheetPartCircuitJsonRequest[] = []
  let fetchCallsB = 0
  const engineA: PartsEngine = {
    findPart: async () => ({}),
    fetchPartCircuitJson: async (request) => {
      requestsA.push(request)
      return request.manufacturerPartNumber === "HIGH_VOLTAGE"
        ? highVoltage
        : lowVoltage
    },
  }
  const engineB: PartsEngine = {
    findPart: async () => ({}),
    fetchPartCircuitJson: async () => {
      fetchCallsB++
      return lowVoltage
    },
  }
  const { circuit } = getTestFixture({
    platform: { pcbDisabled: true, schematicDisabled: true },
  })
  circuit.add(
    <group subcircuit>
      <group name="A" subcircuit partsEngine={engineA}>
        <chip
          name="U1"
          manufacturerPartNumber="HIGH_VOLTAGE"
          supplierPartNumbers={{ jlcpcb: ["C_COMMON"] }}
          pinAttributes={{
            pin1: { requiresPower: true, requiresVoltage: "1.8V" },
            pin2: { requiresGround: true },
          }}
          pinLabels={{ pin1: "VDD", pin2: "GND" }}
        />
        <chip
          name="U2"
          manufacturerPartNumber="LOW_VOLTAGE"
          supplierPartNumbers={{ jlcpcb: ["C_COMMON"] }}
          pinAttributes={{
            pin1: { requiresPower: true, requiresVoltage: "3.3V" },
            pin2: { requiresGround: true },
          }}
          pinLabels={{ pin1: "VDD", pin2: "GND" }}
        />
      </group>
      <group name="B" subcircuit partsEngine={engineB}>
        <chip
          name="U3"
          manufacturerPartNumber="HIGH_VOLTAGE"
          supplierPartNumbers={{ jlcpcb: ["C_COMMON"] }}
          pinAttributes={{
            pin1: { requiresPower: true, requiresVoltage: "1.8V" },
            pin2: { requiresGround: true },
          }}
          pinLabels={{ pin1: "VDD", pin2: "GND" }}
        />
      </group>
    </group>,
  )
  await circuit.renderUntilSettled()
  expect(
    requestsA.map((request) => [
      request.supplierPartNumber,
      request.manufacturerPartNumber,
    ]),
  ).toEqual([
    ["C_COMMON", "HIGH_VOLTAGE"],
    ["C_COMMON", "LOW_VOLTAGE"],
  ])
  expect(fetchCallsB).toBe(1)
  const warnings =
    circuit.db.source_component_pins_underspecified_warning.list()
  expect(warnings).toHaveLength(2)
  expect(
    warnings.some(
      (warning) =>
        warning.message.includes("Chip U1 ") &&
        warning.message.includes("fetched requires_voltage: 3.3"),
    ),
  ).toBe(true)
  expect(
    warnings.some(
      (warning) =>
        warning.message.includes("Chip U2 ") &&
        warning.message.includes("fetched requires_voltage: 1.8"),
    ),
  ).toBe(true)
})
