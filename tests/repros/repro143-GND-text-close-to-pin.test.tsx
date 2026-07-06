import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro143: GND text close to pin", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <chip
        name="CHIP1"
        manufacturerPartNumber="SOMETHING_THAT_IS_LONG"
        pinLabels={{
          pin1: "P1",
          pin2: "P2",
          pin3: "P3",
          pin4: "P4",
          pin5: "P5",
          pin6: "P6",
          pin7: "P7",
          pin8: "P8",
          pin9: "P9",
          pin10: "P10",
          pin11: "P11",
          pin12: "P12",
          pin13: "P13",
          pin14: "P14",
          pin15: "P15",
          pin16: "P16",
        }}
        connections={{
          pin16: "net.GND",
          pin15: "net.GND",
          pin14: "net.GND",
          pin13: "net.GND",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
