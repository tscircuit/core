import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin13: "EH1",
  pin14: "EH2",
  pin15: "pin13_alt1",
  pin16: "pin14_alt1",
} as const

test("repro145: usb connector GND label close to right-side pins", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board width="20mm" height="18mm">
      <chip
        name="J_USB"
        manufacturerPartNumber="TYPE_C_16PIN_2MD_073_"
        schX={0}
        schY={0}
        pinLabels={pinLabels}
        schPinArrangement={{
          leftSide: {
            pins: [1, 2, 3, 4, 5, 6, 7, 8],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: [16, 15, 14, 13, 12, 11, 10, 9],
            direction: "top-to-bottom",
          },
        }}
      />

      <trace from="J_USB.pin16" to="net.GND" />
      <trace from="J_USB.pin15" to="net.GND" />
      <trace from="J_USB.pin14" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
