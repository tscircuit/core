import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("electrical roles, aliases, zero voltage and intentional no-connects satisfy pin validation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "INPUT",
          pin2: "OUTPUT",
          pin3: "BIDIRECTIONAL",
          pin4: "PASSIVE",
          pin5: "GPIO",
          pin6: "ZERO",
          pin7: ["BUS", "SDA"],
          pin8: "NC",
        }}
        pinAttributes={{
          pin1: { isInput: true },
          "2": { isOutput: true, isUsingOpenDrain: true },
          BIDIRECTIONAL: {
            isBidirectional: true,
            isInput: false,
            isOutput: false,
          },
          PASSIVE: { isPassive: true },
          GPIO: { isGpio: true, providesPower: true, requiresPower: true },
          ZERO: { requiresGround: true, providesVoltage: 0 },
          SDA: { capabilities: ["i2c_sda"] },
        }}
        noConnect={["NC"]}
      />
      <chip
        name="U2"
        footprint="pinrow2"
        pinAttributes={{
          pin1: { providesGround: true },
          pin2: { requiresVoltage: "-5V" },
        }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component_pins_underspecified_warning.list(),
  ).toHaveLength(0)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
