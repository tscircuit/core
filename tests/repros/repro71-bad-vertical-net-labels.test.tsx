import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { WS2812B_2020 } from "tests/projects/seveibar__rp2040-zero/imports/WS2812B_2020"

test("issue 1671 vertical net labels", async () => {
  const { circuit, createPCB } = getTestFixture()

  const U1 = () => (
    <chip
      name="U1"
      schX={0}
      schY={0}
      pinLabels={{
        "1": "A0",
        "2": "A1",
        "3": "A2",
        "4": "A3",
        "5": "SDA",
        "6": "SCL",
        "7": "TX",
        "8": "VBUS",
        "9": "GND1",
        "10": "V3_3",
        "11": "MOSI",
        "12": "MISO",
        "13": "SCK",
        "14": "RX",
      }}
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: [1, 2, 3, 4, 5, 6, 7],
        },
        rightSide: {
          direction: "top-to-bottom",
          pins: [14, 13, 12, 11, 10, 9, 8],
        },
      }}
    />
  )

  circuit.add(
    <group>
      <U1 />
      <resistor name="AJ1" resistance="0 ohm" schX={5} schY={-1} />
      <trace from=".U1 > .MOSI" to=".AJ1 > .1" />
    </group>
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
