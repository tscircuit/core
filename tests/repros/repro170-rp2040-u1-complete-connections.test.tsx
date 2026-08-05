import { expect, test } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import type { InputProblem } from "@tscircuit/schematic-trace-solver"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const denseTraceProps = { thickness: "0.1mm" } as const
const gndLabel = { displayName: "GND", schDisplayLabel: "GND" } as const
const v3v3Label = { displayName: "V3V3", schDisplayLabel: "V3V3" } as const
const v1v1Label = { displayName: "V1V1", schDisplayLabel: "V1V1" } as const
const adcRefLabel = {
  displayName: "ADC_REF",
  schDisplayLabel: "ADC_REF",
} as const
const schSections = {
  rp2040: "rp2040",
  usb: "usb",
  clock: "clock",
  status: "status",
} as const

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

const flashPinLabels = {
  pin1: ["CS"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["GND"],
  pin5: ["pin5"],
  pin6: ["CLK"],
  pin7: ["pin7"],
  pin8: ["VCC"],
  pin9: ["EP"],
} as const

const pushButtonPinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
} as const

const RP2040 = (props: ChipProps<typeof pinLabels>) => (
  <chip
    pinLabels={pinLabels}
    supplierPartNumbers={{ jlcpcb: ["C2040"] }}
    manufacturerPartNumber="RP2040"
    footprint="qfn56_thermalpad3.1mmx3.1mm_p0.4001mm_w7.8999mm_h7.9001mm_pw0.2mm_pl0.85mm"
    {...props}
  />
)

test("repro170: complete RP2040 U1 schematic connections", async () => {
  const { circuit } = getTestFixture()
  let schematicTraceInputProblem: InputProblem | undefined

  circuit.on("solver:started", (event) => {
    if (event.solverName === "SchematicTracePipelineSolver") {
      schematicTraceInputProblem = event.solverParams as InputProblem
    }
  })

  circuit.add(
    <board width="30mm" height="30mm" routingDisabled>
      <schematicsection
        name={schSections.rp2040}
        displayName="RP2040 & Power"
      />
      <schematicsection
        name={schSections.usb}
        displayName="Programming USB-C & QSPI"
      />
      <schematicsection name={schSections.clock} displayName="Clock" />
      <schematicsection
        name={schSections.status}
        displayName="Status & SWD Debug"
      />

      <RP2040
        name="U1"
        showPinAliases
        schSectionName={schSections.rp2040}
        pcbX={0}
        pcbY={0.5}
        schX={-0.08}
        schY={-2.5}
        schWidth={2.8}
        schHeight={5.8}
      />

      <capacitor
        name="C_CORE"
        capacitance="1uF"
        footprint="0402"
        schSectionName={schSections.rp2040}
        schOrientation="vertical"
        pcbX={3.8}
        pcbY={-5.5}
        schX={-3.65}
        schY={-3.7}
      />

      <resistor
        name="R_RUN"
        resistance="10k"
        footprint="0402"
        schSectionName={schSections.status}
        schX={12.8}
        schY={-13.5}
        schRotation={90}
      />
      <chip
        name="U2"
        pinLabels={flashPinLabels}
        manufacturerPartNumber="W25Q16JVUXIQ"
        footprint="wson"
        schSectionName={schSections.usb}
        schX={17}
        schY={-4}
        schHeight={2}
        schPinArrangement={{
          leftSide: [8, 1, 2, 3, 5, 6, 7, 4, 9],
        }}
      />
      <resistor
        name="R_USB1"
        resistance="27"
        footprint="0402"
        schSectionName={schSections.usb}
        schX={13.3}
        schY={-7.7}
      />
      <resistor
        name="R_USB2"
        resistance="27"
        footprint="0402"
        schSectionName={schSections.usb}
        schX={13.3}
        schY={-6.6}
      />
      <crystal
        name="Y1"
        frequency="12MHz"
        loadCapacitance="12pF"
        pinVariant="four_pin"
        footprint="crystal"
        schSectionName={schSections.clock}
        schX={1.2}
        schY={-12.5}
      />
      <pushbutton
        name="SW_BOOT"
        pinLabels={pushButtonPinLabels}
        footprint="smdpushbutton"
        internallyConnectedPins={[
          ["pin1", "pin2"],
          ["pin3", "pin4"],
        ]}
        schSectionName={schSections.status}
        schX={8.6}
        schY={-12}
      />
      <pushbutton
        name="SW_RUN"
        pinLabels={pushButtonPinLabels}
        footprint="smdpushbutton"
        internallyConnectedPins={[
          ["pin1", "pin2"],
          ["pin3", "pin4"],
        ]}
        schSectionName={schSections.status}
        schX={12.8}
        schY={-12}
      />
      <resistor
        name="R_BOOT"
        resistance="10k"
        footprint="0402"
        schSectionName={schSections.status}
        schX={8.6}
        schY={-13.5}
        schRotation={90}
      />
      <resistor
        name="R_LED"
        resistance="330"
        footprint="0402"
        schSectionName={schSections.status}
        schX={10.4}
        schY={-12.2}
        schRotation={270}
      />
      <testpoint
        name="TP_SWCLK"
        footprintVariant="pad"
        padShape="circle"
        padDiameter="1.1mm"
        schSectionName={schSections.status}
        schX={8.6}
        schY={-16.5}
      />
      <testpoint
        name="TP_SWDIO"
        footprintVariant="pad"
        padShape="circle"
        padDiameter="1.1mm"
        schSectionName={schSections.status}
        schX={12.2}
        schY={-16.5}
      />

      <trace
        {...denseTraceProps}
        name="RUN_R"
        from=".R_RUN > .pin1"
        to=".U1 > .RUN"
      />
      <trace name="TEST_G" from=".U1 > .TESTEN" to="net.GND" {...gndLabel} />

      <trace
        {...denseTraceProps}
        name="QSPI_SS"
        from=".U1 > .QSPI_SS"
        to=".U2 > .CS"
        schDisplayLabel="QSPI_SS"
      />
      <trace
        {...denseTraceProps}
        name="QSPI_SD0"
        from=".U1 > .QSPI_SD0"
        to=".U2 > .pin5"
        schDisplayLabel="QSPI_SD0"
      />
      <trace
        {...denseTraceProps}
        name="QSPI_SD1"
        from=".U1 > .QSPI_SD1"
        to=".U2 > .pin2"
        schDisplayLabel="QSPI_SD1"
      />
      <trace
        {...denseTraceProps}
        name="QSPI_SD2"
        from=".U1 > .QSPI_SD2"
        to=".U2 > .pin3"
        schDisplayLabel="QSPI_SD2"
      />
      <trace
        {...denseTraceProps}
        name="QSPI_SD3"
        from=".U1 > .QSPI_SD3"
        to=".U2 > .pin7"
        schDisplayLabel="QSPI_SD3"
      />
      <trace
        {...denseTraceProps}
        name="QSPI_SCLK"
        from=".U1 > .QSPI_SCLK"
        to=".U2 > .CLK"
        schDisplayLabel="QSPI_SCLK"
      />

      <trace
        {...denseTraceProps}
        name="IOVDD1_P"
        from=".U1 > .IOVDD1"
        to="net.V3V3"
        {...v3v3Label}
      />
      <trace
        {...denseTraceProps}
        name="IOVDD2_P"
        from=".U1 > .IOVDD2"
        to="net.V3V3"
        {...v3v3Label}
      />
      <trace
        {...denseTraceProps}
        name="IOVDD3_P"
        from=".U1 > .IOVDD3"
        to="net.V3V3"
        {...v3v3Label}
      />
      <trace
        {...denseTraceProps}
        name="IOVDD4_P"
        from=".U1 > .IOVDD4"
        to="net.V3V3"
        {...v3v3Label}
      />
      <trace
        {...denseTraceProps}
        name="IOVDD5_P"
        from=".U1 > .IOVDD5"
        to="net.V3V3"
        {...v3v3Label}
      />
      <trace
        {...denseTraceProps}
        name="IOVDD6_P"
        from=".U1 > .IOVDD6"
        to="net.V3V3"
        {...v3v3Label}
      />
      <trace
        {...denseTraceProps}
        name="DVDD1_P"
        from=".U1 > .DVDD1"
        to="net.V1V1"
        {...v1v1Label}
      />
      <trace
        {...denseTraceProps}
        name="DVDD2_P"
        from=".U1 > .DVDD2"
        to="net.V1V1"
        {...v1v1Label}
      />
      <trace
        {...denseTraceProps}
        name="VREG_IN_P"
        from=".U1 > .VREG_IN"
        to="net.V3V3"
        {...v3v3Label}
      />
      <trace
        {...denseTraceProps}
        name="VREG_VOUT_P"
        from=".U1 > .VREG_VOUT"
        to="net.V1V1"
        {...v1v1Label}
      />
      <trace
        {...denseTraceProps}
        name="USB_VDD_P"
        from=".U1 > .USB_VDD"
        to="net.V3V3"
        {...v3v3Label}
      />
      <trace name="GND_G" from=".U1 > .GND" to="net.GND" {...gndLabel} />
      <trace
        {...denseTraceProps}
        name="USBV_IO1"
        from=".U1 > .USB_VDD"
        to=".U1 > .IOVDD1"
      />

      <trace
        {...denseTraceProps}
        name="USB_DN"
        from=".R_USB1 > .pin2"
        to=".U1 > .USB_DM"
      />
      <trace
        {...denseTraceProps}
        name="USB_DP"
        from=".R_USB2 > .pin2"
        to=".U1 > .USB_DP"
      />

      <trace
        name="CORE_P"
        from=".C_CORE > .pin1"
        to="net.V1V1"
        {...v1v1Label}
      />
      <trace name="CORE_G" from=".C_CORE > .pin2" to="net.GND" {...gndLabel} />
      <trace
        name="ADC_AVDD"
        from=".U1 > .ADC_AVDD"
        to="net.ADC_VREF"
        {...adcRefLabel}
      />

      <trace name="XIN" from=".Y1 > .pin1" to=".U1 > .XIN" maxLength="10mm" />
      <trace name="XOUT" from=".Y1 > .pin3" to=".U1 > .XOUT" maxLength="10mm" />
      <trace name="BOOT_SW" from=".SW_BOOT > .pin1" to=".U1 > .QSPI_SS" />
      <trace name="BOOT_R" from=".R_BOOT > .pin1" to=".U1 > .QSPI_SS" />
      <trace name="RUN_SW" from=".SW_RUN > .pin1" to=".U1 > .RUN" />
      <trace name="LED_GP25" from=".U1 > .GPIO25" to=".R_LED > .pin1" />
      <trace name="SWCLK" from=".U1 > .SWCLK" to=".TP_SWCLK > .pin1" />
      <trace name="SWD" from=".U1 > .SWD" to=".TP_SWDIO > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  // These IDs identify direct connections on the same QSPI_SS net, so each
  // connection must use the width of the canonical rendered QSPI_SS label.
  expect(
    schematicTraceInputProblem?.directConnections
      .filter(({ netId }) =>
        ["QSPI_SS", "BOOT_SW", "BOOT_R"].includes(netId ?? ""),
      )
      .map(({ netId, netLabelWidth }) => ({
        directConnectionNetId: netId,
        canonicalNetLabelWidth: netLabelWidth,
      })),
  ).toEqual([
    { directConnectionNetId: "QSPI_SS", canonicalNetLabelWidth: 0.96 },
    { directConnectionNetId: "BOOT_SW", canonicalNetLabelWidth: 0.96 },
    { directConnectionNetId: "BOOT_R", canonicalNetLabelWidth: 0.96 },
  ])

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
