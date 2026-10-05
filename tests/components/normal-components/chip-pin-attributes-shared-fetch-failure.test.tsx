import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { Chip } from "lib/components/normal-components/Chip"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("failed and missing metadata is cached for repeated chips but a new circuit can retry", async () => {
  for (const failureMode of ["rejected", "missing", "empty"] as const) {
    let fetchCalls = 0
    const partsEngine: PartsEngine = {
      findPart: async () => ({}),
      fetchPartCircuitJson: async () => {
        fetchCalls++
        if (failureMode === "rejected") throw new Error("Metadata unavailable")
        return failureMode === "empty" ? [] : undefined
      },
    }
    const callsPerAttempt = failureMode === "rejected" ? 3 : 1
    for (let circuitNumber = 1; circuitNumber <= 2; circuitNumber++) {
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
      await circuit.renderUntilSettled()
      expect(fetchCalls).toBe(callsPerAttempt * circuitNumber)
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
      expect(fetchCalls).toBe(callsPerAttempt * circuitNumber)
      expect(
        circuit.db.source_component_pins_underspecified_warning.list(),
      ).toHaveLength(0)
    }
  }
})
