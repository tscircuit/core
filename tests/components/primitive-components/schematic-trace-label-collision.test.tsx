import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace label overlap", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="90mm" height="60mm" routingDisabled>
      <resistor
        name="R7"
        resistance="1k"
        footprint="0402"
        schX={-1.4}
        schY={-6.6}
        schSectionName="qspi"
        connections={{ pin1: "net.V3V3", pin2: "net.QSPI_CS" }}
      />
      <chip
        name="U5"
        manufacturerPartNumber="8MB QSPI Flash"
        footprint="soic8"
        schX={0}
        schY={-8.4}
        schWidth={2.245}
        schHeight={1.0}
        schSectionName="qspi"
        pinLabels={{
          pin1: "SCK",
          pin2: "MOSI",
          pin3: "MISO",
          pin4: "SSEL",
          pin5: "WP_IO2",
          pin6: "HOLD_IO3",
          pin7: "VSS",
          pin8: "VCC",
        }}
        schPinArrangement={{
          leftSide: ["pin1", "pin2", "pin3", "pin4"],
          rightSide: ["pin5", "pin6", "pin8", "pin7"],
        }}
        connections={{
          SCK: "net.QSPI_SCK",
          MOSI: "net.QSPI_DATA0",
          MISO: "net.QSPI_DATA1",
          SSEL: "net.QSPI_CS",
          WP_IO2: "net.QSPI_DATA2",
          HOLD_IO3: "net.QSPI_DATA3",
          VSS: "net.GND",
          VCC: "net.V3V3",
        }}
      />
      <netlabel net="QSPI_SCK" connectsTo=".U5 > .SCK" />
      <netlabel net="QSPI_DATA0" connectsTo=".U5 > .MOSI" />
      <netlabel net="QSPI_DATA1" connectsTo=".U5 > .MISO" />
      <netlabel net="QSPI_CS" connectsTo=".U5 > .SSEL" />
      <netlabel net="QSPI_DATA2" connectsTo=".U5 > .WP_IO2" />
      <netlabel net="QSPI_DATA3" connectsTo=".U5 > .HOLD_IO3" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
