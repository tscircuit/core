import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unavailable comparison metadata does not prevent a custom chip configuration rendering", async () => {
  let fetchCalls = 0
  const partsEngine: PartsEngine = {
    findPart: async () => ({}),
    fetchPartCircuitJson: async () => {
      fetchCalls++
      throw new Error("Part metadata unavailable")
    },
  }
  const { circuit } = getTestFixture({
    platform: { pcbDisabled: true, schematicDisabled: true },
  })
  circuit.add(
    <group subcircuit partsEngine={partsEngine}>
      <chip
        name="U1"
        manufacturerPartNumber="TEST_CHIP"
        pinLabels={{ pin1: "VDD", pin2: "GND" }}
        pinAttributes={{
          VDD: { requiresPower: true, requiresVoltage: "1.8V" },
          GND: { requiresGround: true },
        }}
      />
    </group>,
  )
  await circuit.renderUntilSettled()
  expect(fetchCalls).toBe(3)
  expect(
    circuit.db.source_component_pins_underspecified_warning.list(),
  ).toHaveLength(0)
  expect(
    circuit.db.source_port.list().find((port) => port.name === "VDD"),
  ).toMatchObject({ requires_voltage: 1.8 })
  await circuit.renderUntilSettled()
  expect(fetchCalls).toBe(3)
})
