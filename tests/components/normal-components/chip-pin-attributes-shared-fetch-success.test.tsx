import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { Chip } from "lib/components/normal-components/Chip"
import { Fragment } from "react"
import { getChipPinMetadataFixture } from "tests/fixtures/get-chip-pin-metadata-fixture"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repeated chips share pending and successful metadata fetches while retaining their own warnings", async () => {
  const { importedCircuitJson } = getChipPinMetadataFixture([
    { requires_power: true, requires_voltage: 3.3 },
    { requires_ground: true, requires_voltage: 0 },
  ])
  let releaseFetch!: () => void
  const fetchGate = new Promise<void>((resolve) => {
    releaseFetch = resolve
  })
  let fetchCalls = 0
  const partsEngine: PartsEngine = {
    findPart: async () => ({}),
    fetchPartCircuitJson: async () => {
      fetchCalls++
      await fetchGate
      return importedCircuitJson
    },
  }
  const { circuit } = getTestFixture({
    platform: { pcbDisabled: true, schematicDisabled: true },
  })
  circuit.add(
    <group name="parts" subcircuit partsEngine={partsEngine}>
      {Array.from({ length: 6 }, (_, chipIndex) => (
        <Fragment key={chipIndex}>
          <chip
            name={`U${chipIndex + 1}`}
            manufacturerPartNumber="TEST_CHIP"
            pinLabels={{ pin1: "VDD", pin2: "GND" }}
            pinAttributes={{
              VDD: { requiresPower: true, requiresVoltage: "1.8V" },
              GND: { requiresGround: true },
            }}
          />
        </Fragment>
      ))}
    </group>,
  )
  circuit.render()
  // The request remains pending while all six chips reach their source checks.
  expect(fetchCalls).toBe(1)
  releaseFetch()
  await circuit.renderUntilSettled()
  const warnings =
    circuit.db.source_component_pins_underspecified_warning.list()
  expect(warnings).toHaveLength(6)
  for (let chipNumber = 1; chipNumber <= 6; chipNumber++) {
    expect(
      warnings.some((warning) =>
        warning.message.includes(`Chip U${chipNumber} `),
      ),
    ).toBe(true)
  }
  circuit.firstChild!.add(
    new Chip<string>({
      name: "U7",
      manufacturerPartNumber: "TEST_CHIP",
      pinLabels: { pin1: "VDD", pin2: "GND" },
      pinAttributes: {
        VDD: { requiresPower: true, requiresVoltage: "1.8V" },
        GND: { requiresGround: true },
      },
    }),
  )
  await circuit.renderUntilSettled()
  expect(fetchCalls).toBe(1)
  expect(
    circuit.db.source_component_pins_underspecified_warning.list(),
  ).toHaveLength(7)
})
