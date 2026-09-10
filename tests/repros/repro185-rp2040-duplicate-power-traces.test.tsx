import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin1: ["IOVDD6"],
  pin2: ["GPIO0"],
  pin3: ["GPIO1"],
  pin4: ["GPIO2"],
  pin5: ["GPIO3"],
  pin6: ["GPIO4"],
  pin7: ["GPIO5"],
  pin8: ["GPIO6"],
  pin9: ["GPIO7"],
  pin10: ["IOVDD5"],
  pin11: ["GPIO8"],
  pin12: ["GPIO9"],
  pin13: ["GPIO10"],
  pin14: ["GPIO11"],
  pin15: ["GPIO12"],
  pin16: ["GPIO13"],
  pin17: ["GPIO14"],
  pin18: ["GPIO15"],
  pin19: ["TESTEN"],
  pin20: ["XIN"],
  pin21: ["XOUT"],
  pin22: ["IOVDD4"],
  pin23: ["DVDD2"],
  pin24: ["SWCLK"],
  pin25: ["SWD"],
  pin26: ["RUN"],
  pin27: ["GPIO16"],
  pin28: ["GPIO17"],
  pin29: ["GPIO18"],
  pin30: ["GPIO19"],
  pin31: ["GPIO20"],
  pin32: ["GPIO21"],
  pin33: ["IOVDD3"],
  pin34: ["GPIO22"],
  pin35: ["GPIO23"],
  pin36: ["GPIO24"],
  pin37: ["GPIO25"],
  pin38: ["GPIO26_ADC0"],
  pin39: ["GPIO27_ADC1"],
  pin40: ["GPIO28_ADC2"],
  pin41: ["GPIO29_ADC3"],
  pin42: ["IOVDD2"],
  pin43: ["ADC_AVDD"],
  pin44: ["VREG_IN"],
  pin45: ["VREG_VOUT"],
  pin46: ["USB_DM"],
  pin47: ["USB_DP"],
  pin48: ["USB_VDD"],
  pin49: ["IOVDD1"],
  pin50: ["DVDD1"],
  pin51: ["QSPI_SD3"],
  pin52: ["QSPI_SCLK"],
  pin53: ["QSPI_SD0"],
  pin54: ["QSPI_SD2"],
  pin55: ["QSPI_SD1"],
  pin56: ["QSPI_SS"],
  pin57: ["GND", "thermalpad"],
} as const

// Keep the original pin order/spacing and replace off-chip signals with nets.
// Repro: redundant parallel V3V3 routes beside IOVDD2 / VREG_IN.
test("repro185: RP2040 duplicate power traces", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board routingDisabled>
      <net name="V3V3" isPowerNet />
      <net name="V1V1" isPowerNet />
      <net name="GND" isGroundNet />
      <chip
        name="U1"
        manufacturerPartNumber="RP2040"
        pinLabels={pinLabels}
        showPinAliases
        schX={-0.08}
        schY={-2.5}
        schWidth={2.8}
        schHeight={5.8}
      />
      <trace from=".U1 > .TESTEN" to="net.GND" schDisplayLabel="GND" />
      <trace from=".U1 > .QSPI_SS" to="net.QSPI_SS" schDisplayLabel="QSPI_SS" />
      <trace
        from=".U1 > .QSPI_SD0"
        to="net.QSPI_SD0"
        schDisplayLabel="QSPI_SD0"
      />
      <trace
        from=".U1 > .QSPI_SD1"
        to="net.QSPI_SD1"
        schDisplayLabel="QSPI_SD1"
      />
      <trace
        from=".U1 > .QSPI_SD2"
        to="net.QSPI_SD2"
        schDisplayLabel="QSPI_SD2"
      />
      <trace
        from=".U1 > .QSPI_SD3"
        to="net.QSPI_SD3"
        schDisplayLabel="QSPI_SD3"
      />
      <trace
        from=".U1 > .QSPI_SCLK"
        to="net.QSPI_SCLK"
        schDisplayLabel="QSPI_SCLK"
      />
      <trace from=".U1 > .IOVDD1" to="net.V3V3" schDisplayLabel="V3V3" />
      <trace from=".U1 > .IOVDD2" to="net.V3V3" schDisplayLabel="V3V3" />
      <trace from=".U1 > .IOVDD3" to="net.V3V3" schDisplayLabel="V3V3" />
      <trace from=".U1 > .IOVDD4" to="net.V3V3" schDisplayLabel="V3V3" />
      <trace from=".U1 > .IOVDD5" to="net.V3V3" schDisplayLabel="V3V3" />
      <trace from=".U1 > .IOVDD6" to="net.V3V3" schDisplayLabel="V3V3" />
      <trace from=".U1 > .DVDD1" to="net.V1V1" schDisplayLabel="V1V1" />
      <trace from=".U1 > .DVDD2" to="net.V1V1" schDisplayLabel="V1V1" />
      <trace from=".U1 > .VREG_IN" to="net.V3V3" schDisplayLabel="V3V3" />
      <trace from=".U1 > .VREG_VOUT" to="net.V1V1" schDisplayLabel="V1V1" />
      <trace from=".U1 > .USB_VDD" to="net.V3V3" schDisplayLabel="V3V3" />
      <trace from=".U1 > .GND" to="net.GND" schDisplayLabel="GND" />
      <trace name="USBV_IO1" from=".U1 > .USB_VDD" to=".U1 > .IOVDD1" />
      <trace from=".U1 > .USB_DM" to="net.USB_DM" schDisplayLabel="USB_DM" />
      <trace from=".U1 > .USB_DP" to="net.USB_DP" schDisplayLabel="USB_DP" />
      <trace
        from=".U1 > .ADC_AVDD"
        to="net.ADC_VREF"
        schDisplayLabel="ADC_REF"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const v3v3Net = circuit.db.source_net.getWhere({ name: "V3V3" })!
  const iovdd2Port = circuit.db.schematic_port.getWhere({ pin_number: 42 })!
  const vregInPort = circuit.db.schematic_port.getWhere({ pin_number: 44 })!

  // Current bug: two V3V3 vertical routes span pins 42–44 just 0.04 mm apart.
  // These are offsets from the pin endpoint in schematic coordinates
  // (mm, +X right, +Y up). Update this assertion and snapshot when fixed.
  const parallelRouteOffsets = circuit.db.schematic_trace
    .list()
    .filter(
      (trace) =>
        trace.subcircuit_connectivity_map_key ===
        v3v3Net.subcircuit_connectivity_map_key,
    )
    .flatMap((trace) => trace.edges)
    .filter(
      ({ from, to }) =>
        from.x === to.x &&
        from.x > iovdd2Port.center.x &&
        from.x < iovdd2Port.center.x + 0.3 &&
        Math.min(from.y, to.y) <= iovdd2Port.center.y &&
        Math.max(from.y, to.y) >= vregInPort.center.y,
    )
    .map(({ from }) => Number((from.x - iovdd2Port.center.x).toFixed(3)))
    .sort((a, b) => a - b)
  expect(parallelRouteOffsets).toEqual([0.16])

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    width: 900,
    height: 1100,
  })
})
