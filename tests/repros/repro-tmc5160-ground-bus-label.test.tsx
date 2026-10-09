import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin6: ["GNDA"],
  pin7: ["SRAL"],
  pin8: ["SRAH"],
  pin9: ["SRBH"],
  pin10: ["SRBL"],
  pin11: ["TST_MODE"],
  pin12: ["CLK"],
  pin13: ["CSN_CFG3"],
  pin14: ["SCK_CFG2"],
  pin15: ["SDI_CFG1"],
  pin16: ["SDO_CFG0"],
} as const

// Reduced from PD1180-EPR U7 to pins 6–16; PCB, passives, and other sheets
// are not needed. Retain the signal pins below CLK: they constrain label
// placement. The shared ground bus must remain clear of the GND symbol/text.
test("TMC5160 ground bus stays clear of its GND symbol", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board routingDisabled schTraceAutoLabelEnabled schMaxTraceDistance={0.8}>
      <chip
        name="U7"
        manufacturerPartNumber="TMC5160A-TA-T"
        pinLabels={pinLabels}
        schX={-3}
        schY={-3.4}
        schPinArrangement={{
          leftSide: {
            pins: Object.keys(pinLabels),
            direction: "top-to-bottom",
          },
        }}
        pinAttributes={{ pin6: { requiresGround: true } }}
        connections={{
          pin6: "net.GND",
          pin7: "net.GND",
          pin8: "net.SENSE_A",
          pin9: "net.SENSE_B",
          pin10: "net.GND",
          pin11: "net.GND",
          pin12: "net.GND",
          pin13: "net.TMC_CS_N",
          pin14: "net.SPI_SCK",
          pin15: "net.SPI_MOSI",
          pin16: "net.SPI_MISO",
        }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
  })
})
