import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro65: schematic autolayout with pinheader", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <chip
        name="U1"
        pinLabels={{
          pin1: "GND",
          pin2: "3V3",
          pin3: "ADBUS2_MISO",
          pin4: "ADBUS3_CS",
          pin5: "ADBUS4",
          pin6: "ADBUS5",
          pin7: "ADBUS6",
          pin8: "ADBUS7",
          pin9: "ACBUS0",
          pin10: "ACBUS1",
          pin11: "ACBUS2",
          pin12: "ACBUS3",
          pin13: "ACBUS4",
          pin14: "ACBUS5",
          pin15: "ACBUS6",
          pin16: "ACBUS7",
        }}
      />
      <pinheader name="J3" pinCount={16} facingDirection="right" />
      <trace from="J3.pin3" to="U1.pin3" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  expect(circuitJson).toMatchSchematicSnapshot(import.meta.path)
})
