import { W25Q16JVUXIQ } from "./imports/W25Q16JVUXIQ"
import { SKRPACE010 } from "./imports/SKRPACE010"
import { TYPE_C_16PIN_2MD_073_ } from "./imports/TYPE_C_16PIN_2MD_073_"
import { XL_1608SURC_06 } from "./imports/XL_1608SURC_06"
import { XL_5050RGBC_2812B_S } from "./imports/XL_5050RGBC_2812B_S"
import { SN74AHCT1G125DBVR } from "./imports/SN74AHCT1G125DBVR"
import { SM04B_SRSS_TB_LF__SN_ } from "./imports/SM04B_SRSS_TB_LF__SN_"
import { SM06B_SRSS_TB_LF__SN_ } from "./imports/SM06B_SRSS_TB_LF__SN_"
import { RP2350AEssentialKiCadReference } from "./RP2350A_Pico_Layout.circuit"
import { Fragment } from "react"
import { APS6404L_3SQR_SN } from "../imports/APS6404L_3SQR_SN/APS6404L_3SQR_SN"
import { CL05B104KO5NNNC } from "../imports/CL05B104KO5NNNC/CL05B104KO5NNNC"
import { CL10A105KB8NNNC } from "../imports/CL10A105KB8NNNC/CL10A105KB8NNNC"
import { A_0402WGF1002TCE } from "../imports/A_0402WGF1002TCE/A_0402WGF1002TCE"

const gndLabel = { displayName: "GND", schDisplayLabel: "GND" } as const
const groundPlaneTraceProps = { ...gndLabel, thickness: "0.1mm" } as const
const v3v3Label = { displayName: "V3V3", schDisplayLabel: "V3V3" } as const
const vbusLabel = { displayName: "VBUS", schDisplayLabel: "VBUS" } as const
const denseTraceProps = { thickness: "0.1mm" } as const
const signalTraceProps = { thickness: "0.12mm" } as const
const powerTraceProps = { thickness: "0.3mm" } as const

const rectangleOutline = (
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
) => [
  { x: minX, y: minY },
  { x: maxX, y: minY },
  { x: maxX, y: maxY },
  { x: minX, y: maxY },
  { x: minX, y: minY },
]

// The official RP2350A Minimal KiCad design uses separate F.Cu zones for
// VBUS, 3V3, 1V1, GND, and VREG_LX. These broad functional outlines follow
// that electrical purpose around this board's own component placement. They
// are native copper zones, not stored autorouter paths or manually routed
// traces. The copper-pour solver automatically clears foreign pads and traces.
const rgbVbusTopOutline = [
  { x: 2.7, y: 16.5 },
  { x: 7.7, y: 16.5 },
  { x: 7.7, y: 19.2 },
  { x: 6.1, y: 19.2 },
  { x: 6.1, y: 22.3 },
  { x: 2.7, y: 22.3 },
  { x: 2.7, y: 16.5 },
]

const mainV3V3TopOutline = [
  { x: -19.2, y: -24.75 },
  { x: 10.4, y: -24.75 },
  { x: 10.4, y: -23.8 },
  { x: 11.45, y: -23.8 },
  { x: 11.45, y: -22.8 },
  { x: 10.4, y: -22.8 },
  { x: 10.4, y: -21.4 },
  { x: 7.5, y: -21.4 },
  { x: 7.5, y: -23.25 },
  { x: -19.2, y: -23.25 },
  { x: -19.2, y: -24.75 },
]

const mainVbusTopOutline = [
  { x: -8.5, y: -28.4 },
  { x: 15.2, y: -28.4 },
  { x: 15.2, y: -21.35 },
  { x: 11.6, y: -21.35 },
  { x: 11.6, y: -23 },
  { x: 11.9, y: -23 },
  { x: 11.9, y: -25.15 },
  { x: -8.5, y: -25.15 },
  { x: -8.5, y: -28.4 },
]

const localLdoGroundTopOutline = [
  { x: 10.6, y: -24.65 },
  { x: 12.6, y: -24.65 },
  { x: 12.6, y: -21.3 },
  { x: 14.4, y: -21.3 },
  { x: 14.4, y: -20.55 },
  { x: 11.6, y: -20.55 },
  { x: 11.6, y: -23.95 },
  { x: 10.6, y: -23.95 },
  { x: 10.6, y: -24.65 },
]

const localLdoV3V3TopOutline = [
  { x: 9.45, y: -21.55 },
  { x: 10.25, y: -21.55 },
  { x: 10.25, y: -22.9 },
  { x: 11.4, y: -22.9 },
  { x: 11.4, y: -23.65 },
  { x: 9.45, y: -23.65 },
  { x: 9.45, y: -21.55 },
]

const leftHeaderSignals = [
  "V3V3_EN",
  "V3V3",
  "GPIO29_ADC3",
  "GPIO28_ADC2",
  "GPIO27_ADC1",
  "GPIO26_ADC0",
  "GND",
  "GPIO25",
  "GPIO24",
  "GPIO23",
  "GPIO22",
  "GND",
  "GPIO21",
  "GPIO20",
  "GPIO19",
  "GND",
  "GPIO18",
  "GPIO17",
  "GPIO16",
  "RUN",
  "SWDIO",
  "SWCLK",
] as const

const rightHeaderSignals = [
  "GPIO0",
  "GPIO1",
  "GND",
  "GPIO2",
  "GPIO3",
  "GPIO4",
  "GPIO5",
  "GND",
  "GPIO6",
  "GPIO7",
  "GPIO8",
  "GPIO9",
  "GND",
  "GPIO10",
  "GPIO11",
  "GPIO12",
  "GPIO13",
  "GND",
  "GPIO14",
  "GPIO15",
  "V3V3",
  "VBUS",
] as const

const leftHeaderLabels = Object.fromEntries(
  leftHeaderSignals.map((signal, index) => [
    `pin${index + 1}`,
    signal === "GND" ? `GND_${index + 1}` : signal.replace("GPIO", "GP"),
  ]),
)

const rightHeaderLabels = Object.fromEntries(
  rightHeaderSignals.map((signal, index) => [
    `pin${index + 1}`,
    signal === "GND" ? `GND_${index + 1}` : signal.replace("GPIO", "GP"),
  ]),
)

/**
 * Standalone RP2350A USB-C development board.
 *
 * The RP2350A symbol and QFN-60 footprint are imported from JLCPCB part
 * C42411118. Its surrounding flash, crystal, reset, debug, and supply
 * topology follows Raspberry Pi's RP2350 hardware design guidance, with a
 * local 3.3 V regulator and physical headers for every GPIO and SWD signal.
 */
export interface RP2350CompactLayoutProps {
  name?: string
  subcircuit?: boolean
  psram?: boolean
  psramCapEscape?: boolean
  mcuPassiveEscape?: boolean
  clockPassiveEscape?: boolean
  clockRoutingPhase?: number
  westDecouplerEscape?: boolean
  eastSupplyCapEscape?: boolean
  clockResistorEscape?: boolean
  debugTestpointEscape?: boolean
  flashCapEscape?: boolean
  usbResistorEscape?: boolean
  segmentedSupplyPours?: boolean
  headers?: boolean
  pcbX?: number
  pcbY?: number
  pcbRotation?: number
}

export const RP2350CompactLayout = ({
  name = "MCU",
  subcircuit = true,
  psram = false,
  psramCapEscape = false,
  mcuPassiveEscape = false,
  clockPassiveEscape = false,
  clockRoutingPhase,
  westDecouplerEscape = false,
  eastSupplyCapEscape = false,
  clockResistorEscape = false,
  debugTestpointEscape = false,
  flashCapEscape = false,
  usbResistorEscape = false,
  segmentedSupplyPours = false,
  headers = true,
  ...props
}: RP2350CompactLayoutProps = {}) => (
  <group
    name={name}
    subcircuit={subcircuit}
    {...props}
    width="44mm"
    height="80mm"
    minTraceWidth="0.1mm"
    defaultTraceWidth="0.12mm"
    minTraceToPadEdgeClearance="0.1mm"
    minViaHoleDiameter="0.2mm"
    minViaEdgeToPadEdgeClearance="0.1mm"
    minViaHoleEdgeToViaHoleEdgeClearance="0.2mm"
    minPadEdgeToPadEdgeClearance="0.1mm"
    minViaPadDiameter="0.45mm"
    autorouterVersion="beta_pipeline9"
    autorouterEffortLevel={subcircuit ? "10x" : undefined}
    schAutoLayoutEnabled
  >
    <net name="GND" isGroundNet />
    <net name="VBUS" isPowerNet nominalTraceWidth="0.3mm" />
    <net name="V3V3" isPowerNet />
    <net name="USB_DP_OUT" />
    <net name="USB_DM_OUT" />
    {/* Inner-1 carries the broad GND reference zone. It may be split by the
        automatic router where necessary; physical fragments are audited after
        routing but do not replace the zero-DRC and zero-short acceptance gates. */}
    <copperpour
      name="GND_REFERENCE_INNER1"
      layer="inner1"
      connectsTo="net.GND"
      clearance="0.2mm"
      boardEdgeMargin="0.3mm"
      useThermalReliefs
    />

    {/* Preserve the original Pico variant's local functional pours. */}
    {psram && segmentedSupplyPours && (
      <copperpour
        name="V3V3_PSRAM_LOCAL_TOP"
        layer="top"
        connectsTo="net.V3V3"
        clearance="0.2mm"
        outline={rectangleOutline(6, -12.3, 12.2, -8.5)}
      />
    )}
    <copperpour
      name="GND_TOP_U1_EXPOSED_PAD"
      layer="top"
      connectsTo="net.GND"
      clearance="0.15mm"
      outline={rectangleOutline(-1.8, -0.65, 1.8, 2.85)}
    />
    <copperpour
      name="GND_TOP_BUCK_RETURN"
      layer="top"
      connectsTo="net.GND"
      clearance="0.15mm"
      outline={rectangleOutline(-1.2, -4.55, -0.4, -3.85)}
    />
    <copperpour
      name="V3V3_TOP_BUCK_INPUT"
      layer="top"
      connectsTo="net.V3V3"
      clearance="0.15mm"
      outline={rectangleOutline(-1.35, -3.75, -0.35, -2.05)}
    />
    <copperpour
      name="V1V1_TOP_BUCK_OUTPUT"
      layer="top"
      connectsTo=".MCU_CORE > net.V1V1"
      clearance="0.15mm"
      outline={rectangleOutline(-4.45, -5.45, -3.55, -3.55)}
    />
    {/* Automatic routing only; no stored copper paths or routing cache. A
        flattened module must participate in the parent board's phase rather
        than turning its descendant phase into the board-wide route. */}
    {subcircuit && <autoroutingphase minTraceWidth="0.12mm" />}

    <schematicsheet
      name="mcu"
      displayName="RP2350 Core, Power and Clock"
      sheetIndex={0}
      sheetWidth="285mm"
      sheetHeight="185mm"
    >
      <schematicsection name="rp2350" displayName="RP2350A MCU" />
      <schematicsection
        name="regulator"
        displayName="1.1 V Switching Regulator"
      />
      <schematicsection name="decoupling" displayName="MCU Supply Decoupling" />
      <schematicsection name="clock" displayName="12 MHz Crystal Clock" />
      <schematicsection
        name="usb_termination"
        displayName="USB Series Termination"
      />
    </schematicsheet>

    <schematicsheet
      name="core"
      displayName="GPIO, Controls and Connectors"
      sheetIndex={1}
      sheetWidth="285mm"
      sheetHeight="185mm"
    >
      <schematicsection name="left_header" displayName="Left GPIO Header" />
      <schematicsection name="right_header" displayName="Right GPIO Header" />
      <schematicsection name="controls" displayName="Reset and Boot Controls" />
      <schematicsection name="i2c" displayName="STEMMA QT I2C" />
      <schematicsection name="spi" displayName="JST-SH SPI" />
      <schematicsection name="debug" displayName="SWD Test Points" />
    </schematicsheet>

    <schematicsheet
      name="interfaces"
      displayName="Power, USB and Peripherals"
      sheetIndex={2}
      sheetWidth="285mm"
      sheetHeight="185mm"
    >
      <schematicsection name="power" displayName="Power Regulation" />
      <schematicsection name="decoupling" displayName="Supply Decoupling" />
      <schematicsection name="usb" displayName="USB-C Interface" />
      <schematicsection name="flash" displayName="QSPI Flash and Boot" />
      <schematicsection name="psram" displayName="8 MB QSPI PSRAM" />
      <schematicsection name="clock" displayName="12 MHz Clock" />
      <schematicsection name="status" displayName="Status and Test LEDs" />
    </schematicsheet>

    <RP2350AEssentialKiCadReference
      name="MCU_CORE"
      schSheetName="mcu"
      pcbX={0}
      pcbY={0}
      pcbRotation={180}
      noConnectUnusedPins={false}
      usbResistorEscape={usbResistorEscape}
      mcuPassiveEscape={mcuPassiveEscape}
      clockPassiveEscape={clockPassiveEscape}
      clockRoutingPhase={clockRoutingPhase}
      westDecouplerEscape={westDecouplerEscape}
      eastSupplyCapEscape={eastSupplyCapEscape}
      clockResistorEscape={clockResistorEscape}
    >
      {/* Keep the QSPI boot circuit in the MCU routing scope. */}
      <W25Q16JVUXIQ
        name="U2"
        schSheetName="interfaces"
        schSectionName="flash"
        pcbX={mcuPassiveEscape ? -3.5 : -2.5}
        pcbY={mcuPassiveEscape ? 6.5 : 7}
        pcbRotation={270}
        schX={-1}
        schY={5.5}
        schHeight={1}
      />
      <SKRPACE010
        name="U_BOOTSEL"
        pcbStyle={{ silkscreenTextVisibility: "hidden" }}
        schSheetName="core"
        schSectionName="controls"
        schX={-12.56}
        schY={-6.5}
        pcbX={-6}
        pcbY={13.5}
        pcbRotation={180}
      />
      <resistor
        name="R_BOOT"
        resistance="10k"
        footprint="0402"
        supplierPartNumbers={{ jlcpcb: ["C25744"] }}
        schSheetName="interfaces"
        schSectionName="flash"
        schX={-4}
        schY={3.5}
        pcbX={-1}
        pcbY={10.3}
        pcbRotation={180}
      />
      <capacitor
        name="C_FLASH"
        capacitance="100nF"
        maxDecouplingTraceLength={5.5}
        footprint="0402"
        supplierPartNumbers={{ jlcpcb: ["C1525"] }}
        schSheetName="interfaces"
        schSectionName="flash"
        schX={2}
        schY={3.5}
        schOrientation="vertical"
        pcbX={flashCapEscape ? -0.7 : mcuPassiveEscape ? -4.8 : -5}
        pcbY={flashCapEscape ? 8.55 : mcuPassiveEscape ? 9.3 : 10.3}
        pcbRotation={90}
      />
      <testpoint
        name="TP_SWCLK"
        pcbStyle={{ silkscreenTextVisibility: "hidden" }}
        footprintVariant="pad"
        padShape="circle"
        padDiameter="1.1mm"
        schSheetName="core"
        schSectionName="debug"
        schX={12}
        schY={-5.2}
        pcbX={4}
        pcbY={-10}
      />
      {/* BOOTSEL series protection; no manual copper path. */}
      <resistor
        name="R_BOOT_SERIES"
        resistance="1kohm"
        footprint="res_p0.8656mm_pw0.5657mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C106235"] }}
        tolerance="1%"
        schSheetName="interfaces"
        schSectionName="flash"
        pcbX={-3}
        pcbY={10.3}
      />
      <trace
        name="QSPI_SS"
        from=".U1 > .QSPI_SS"
        to=".U2 > .CS"
        {...denseTraceProps}
      />
      <trace
        name="QSPI_SD0"
        from=".U1 > .QSPI_SD0"
        to=".U2 > .pin5"
        {...denseTraceProps}
      />
      <trace
        name="QSPI_SD1"
        from=".U1 > .QSPI_SD1"
        to=".U2 > .pin2"
        {...denseTraceProps}
      />
      <trace
        name="QSPI_SD2"
        from=".U1 > .QSPI_SD2"
        to=".U2 > .pin3"
        {...denseTraceProps}
      />
      <trace
        name="QSPI_SD3"
        from=".U1 > .QSPI_SD3"
        to=".U2 > .pin7"
        {...denseTraceProps}
      />
      <trace
        name="QSPI_SCLK"
        from=".U1 > .QSPI_SCLK"
        to=".U2 > .CLK"
        {...denseTraceProps}
      />
      <trace name="FLASH_VCC" from=".U2 > .VCC" to="net.V3V3" />
      <trace
        name="FLASH_GND"
        from=".U2 > .GND"
        to="net.GND"
        thickness="0.1mm"
      />
      <trace name="FLASH_EP" from=".U2 > .EP" to="net.GND" thickness="0.1mm" />
      <trace
        name="C_FLASH_P"
        from=".C_FLASH > .pin1"
        to=".U2 > .VCC"
        thickness="0.1mm"
      />
      <trace
        name="C_FLASH_G"
        from=".C_FLASH > .pin2"
        to="net.GND"
        thickness="0.1mm"
      />
      <trace name="BOOT_PULLUP" from=".R_BOOT > .pin1" to=".U1 > .QSPI_SS" />
      <trace name="BOOT_PULLUP_3V3" from=".R_BOOT > .pin2" to="net.V3V3" />
      <trace
        name="BOOTSEL"
        from=".U_BOOTSEL > .pin1"
        to=".R_BOOT_SERIES > .pin1"
      />
      <trace
        name="BOOTSEL_PROTECTED"
        from=".R_BOOT_SERIES > .pin2"
        to=".U1 > .QSPI_SS"
      />
      <trace
        name="BOOTSEL_GND"
        from=".U_BOOTSEL > .pin3"
        to="net.GND"
        thickness="0.1mm"
      />
      <trace name="SWCLK_TEST" from=".U1 > .SWCLK" to=".TP_SWCLK > .pin1" />
      {psram && (
        <group name="EXTERNAL_RAM" schSheetName="interfaces" schX={9} schY={7}>
          {/* QMI shares clock/data with flash; GPIO0 supplies the independent
              CS1n. This is RAM, not a replacement for the boot flash. */}
          <APS6404L_3SQR_SN
            name="U_PSRAM"
            pcbX={-11}
            pcbY={7}
            pcbRotation={270}
            schX={0}
            schY={0}
          />
          <CL10A105KB8NNNC
            name="C_PSRAM_BULK"
            pcbX={-11}
            pcbY={11.2}
            schX={-3}
            schY={-3}
            maxVoltageRating="50V"
            maxDecouplingTraceLength="5.5mm"
          />
          <CL05B104KO5NNNC
            name="C_PSRAM_HF"
            pcbX={psramCapEscape ? -6.7 : -6.5}
            pcbY={psramCapEscape ? 10.65 : 7}
            pcbRotation={psramCapEscape ? 180 : 270}
            schX={0}
            schY={-3}
            maxVoltageRating="16V"
            maxDecouplingTraceLength="5.5mm"
          />
          <A_0402WGF1002TCE
            name="R_PSRAM_CS"
            pcbX={-16}
            pcbY={7}
            pcbRotation={90}
            schX={3}
            schY={-3}
          />
          <trace
            name="PSRAM_CS1"
            from=".U_PSRAM > .N_CE"
            to=".U1 > .GPIO0"
            thickness="0.12mm"
          />
          <trace
            name="PSRAM_CLK"
            from=".U_PSRAM > .SCLK"
            to=".U1 > .QSPI_SCLK"
            thickness="0.12mm"
          />
          <trace
            name="PSRAM_IO0"
            from=".U_PSRAM > .SIO0"
            to=".U1 > .QSPI_SD0"
            thickness="0.12mm"
          />
          <trace
            name="PSRAM_IO1"
            from=".U_PSRAM > .SIO1"
            to=".U1 > .QSPI_SD1"
            thickness="0.12mm"
          />
          <trace
            name="PSRAM_IO2"
            from=".U_PSRAM > .SIO2"
            to=".U1 > .QSPI_SD2"
            thickness="0.12mm"
          />
          <trace
            name="PSRAM_IO3"
            from=".U_PSRAM > .SIO3"
            to=".U1 > .QSPI_SD3"
            thickness="0.12mm"
          />
          <trace
            name="PSRAM_VDD"
            from=".U_PSRAM > .VDD"
            to="net.V3V3"
            thickness="0.3mm"
          />
          <trace
            name="PSRAM_GND"
            from=".U_PSRAM > .VSS"
            to="net.GND"
            thickness="0.1mm"
          />
          <trace
            name="PSRAM_BULK"
            from=".C_PSRAM_BULK > .pin1"
            to=".U_PSRAM > .VDD"
            maxLength="5.5mm"
          />
          <trace
            name="PSRAM_HF"
            from=".C_PSRAM_HF > .pin1"
            to=".U_PSRAM > .VDD"
            maxLength="5.5mm"
          />
          <trace
            name="PSRAM_BULK_GND"
            from=".C_PSRAM_BULK > .pin2"
            to="net.GND"
          />
          <trace name="PSRAM_HF_GND" from=".C_PSRAM_HF > .pin2" to="net.GND" />
          <trace
            name="PSRAM_CS_PULLUP"
            from=".R_PSRAM_CS > .pin1"
            to=".U_PSRAM > .N_CE"
          />
          <trace
            name="PSRAM_CS_PULLUP_VDD"
            from=".R_PSRAM_CS > .pin2"
            to="net.V3V3"
          />
        </group>
      )}
    </RP2350AEssentialKiCadReference>

    {headers && (
      <>
        <pinheader
          name="J_LEFT"
          pinCount={22}
          pitch="2.54mm"
          gender="male"
          footprint="pinrow22_p2.54mm"
          pinLabels={leftHeaderLabels}
          pcbPinLabels={leftHeaderLabels}
          pcbX={-20.7}
          pcbY={-15.45}
          pcbRotation={90}
          schSheetName="core"
          schSectionName="left_header"
          schX={-12.5}
          schY={1.5}
          schWidth={1.055}
          pinAttributes={{ V3V3_EN: { doNotConnect: true } }}
        />
        <pinheader
          name="J_RIGHT"
          pinCount={22}
          pitch="2.54mm"
          gender="male"
          footprint="pinrow22_p2.54mm"
          pinLabels={rightHeaderLabels}
          pcbX={21}
          pcbY={0}
          pcbRotation={90}
          schSheetName="core"
          schSectionName="right_header"
          schX={10}
          schY={1.5}
          schWidth={0.77}
        />
      </>
    )}

    <SKRPACE010
      name="U_RUN"
      pcbStyle={{ silkscreenTextVisibility: "hidden" }}
      schSheetName="core"
      schSectionName="controls"
      schX={-9.44}
      schY={-6.5}
      pcbX={-8}
      pcbY={-16.5}
    />

    {/* Feather-compatible STEMMA QT / Qwiic I2C port. */}
    <SM04B_SRSS_TB_LF__SN_
      name="J_STEMMA_QT"
      pcbStyle={{ silkscreenTextVisibility: "hidden" }}
      schSheetName="core"
      schSectionName="i2c"
      pcbX={16}
      pcbY={36}
      pcbRotation={180}
      schX={0}
      schY={-6.5}
    />
    <SM06B_SRSS_TB_LF__SN_
      name="J_SPI"
      pcbStyle={{ silkscreenTextVisibility: "hidden" }}
      schSheetName="core"
      schSectionName="spi"
      pcbX={-16}
      pcbY={36}
      pcbRotation={180}
      schX={6.5}
      schY={-6.5}
    />

    {/* USB-C receptacle, matching the Pico's USB 2.0 device-side topology. */}
    <TYPE_C_16PIN_2MD_073_
      name="J_USB"
      pcbStyle={{ silkscreenTextVisibility: "hidden" }}
      pinAttributes={{ B8: { doNotConnect: true }, A8: { doNotConnect: true } }}
      schSheetName="interfaces"
      schSectionName="usb"
      pcbX={0}
      pcbY={-36}
      schX={-11}
      schY={5.5}
    />

    <resistor
      name="R_RUN"
      resistance="10k"
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C25744"] }}
      schSheetName="core"
      schSectionName="controls"
      schX={-6.5}
      schY={-6.5}
      pcbX={-12}
      pcbY={-16.5}
      pcbRotation={90}
    />
    <resistor
      name="R_CC1"
      resistance="5.1k"
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C25905"] }}
      schSheetName="interfaces"
      schSectionName="usb"
      schX={-13}
      schY={3.5}
      pcbX={-3.2}
      pcbY={-31.5}
    />
    <resistor
      name="R_CC2"
      resistance="5.1k"
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C25905"] }}
      schSheetName="interfaces"
      schSectionName="usb"
      schX={-9.5}
      schY={3.5}
      pcbX={3.9}
      pcbY={-31.3}
      pcbRotation={270}
    />
    <resistor
      name="R_PWR_LED"
      resistance="1k"
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C11702"] }}
      schSheetName="interfaces"
      schSectionName="status"
      schX={-3}
      schY={-4}
      pcbX={-14}
      pcbY={-19.4}
      pcbRotation={90}
    />
    <resistor
      name="R_STEMMA_POWER"
      resistance="0ohm"
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C17168"] }}
      schSheetName="core"
      schSectionName="i2c"
      pcbX={14}
      pcbY={31.5}
      pcbRotation={90}
    />

    <XL_1608SURC_06
      name="D_PWR"
      pcbStyle={{ silkscreenTextVisibility: "hidden" }}
      color="red"
      schSheetName="interfaces"
      schSectionName="status"
      schX={0}
      schY={-4}
      schRotation={180}
      pcbX={-14}
      pcbY={-22.5}
      pcbRotation={90}
    />

    {/* 5 V addressable RGB test LED, level-shifted from RP2350 GPIO15. */}
    <SN74AHCT1G125DBVR
      name="U_RGB_BUF"
      pcbStyle={{ silkscreenTextVisibility: "hidden" }}
      schSheetName="interfaces"
      schSectionName="status"
      schHeight={0.6}
      schX={-4.96}
      schY={-6}
      pcbX={8}
      pcbY={16.5}
      pcbRotation={270}
    />
    <resistor
      name="R_RGB_DATA"
      resistance="330"
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C100375"] }}
      schSheetName="interfaces"
      schSectionName="status"
      schX={0.96}
      schY={-6}
      pcbX={5.5}
      pcbY={18.5}
      pcbRotation={90}
    />
    <XL_5050RGBC_2812B_S
      name="D_RGB"
      pcbStyle={{ silkscreenTextVisibility: "hidden" }}
      noConnect={["DO"]}
      schSheetName="interfaces"
      schSectionName="status"
      schX={4}
      schY={-6}
      pcbX={0}
      pcbY={21}
      pcbRotation={270}
    />

    <capacitor
      name="C_VBUS"
      capacitance="10uF"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C19702"] }}
      schSheetName="interfaces"
      schSectionName="usb"
      schX={-7.5}
      schY={5.5}
      schOrientation="vertical"
      pcbX={-6.8}
      pcbY={-33.5}
    />
    {/* Explicit local limits include the short pad escape and ground-plane via.
        The original net-only regulator capacitors had no decoupling limit. */}
    <capacitor
      name="C_RGB_BUF"
      capacitance="100nF"
      maxDecouplingTraceLength={5.5}
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C1525"] }}
      schSheetName="interfaces"
      schSectionName="status"
      schX={-4}
      schY={-8}
      schOrientation="vertical"
      pcbX={5.4}
      pcbY={16.5}
      pcbRotation={270}
    />
    <capacitor
      name="C_RGB"
      capacitance="100nF"
      maxDecouplingTraceLength={6.5}
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C1525"] }}
      schSheetName="interfaces"
      schSectionName="status"
      schX={4}
      schY={-8}
      schOrientation="vertical"
      pcbX={-3.5}
      pcbY={21}
      pcbRotation={270}
    />

    <testpoint
      name="TP_SWDIO"
      pcbStyle={{ silkscreenTextVisibility: "hidden" }}
      footprintVariant="pad"
      padShape="circle"
      padDiameter="1.1mm"
      schSheetName="core"
      schSectionName="debug"
      schX={12}
      schY={-3.5}
      pcbX={debugTestpointEscape ? -1.8 : -6}
      pcbY={debugTestpointEscape ? 5.95 : 10}
    />
    <testpoint
      name="TP_GND"
      pcbStyle={{ silkscreenTextVisibility: "hidden" }}
      footprintVariant="pad"
      padShape="circle"
      padDiameter="1.1mm"
      schSheetName="core"
      schSectionName="debug"
      schX={12}
      schY={-6.9}
      pcbX={-7}
      pcbY={16}
    />
    <testpoint
      name="TP_3V3"
      pcbStyle={{ silkscreenTextVisibility: "hidden" }}
      footprintVariant="pad"
      padShape="circle"
      padDiameter="1.1mm"
      schSheetName="core"
      schSectionName="debug"
      schX={12}
      schY={-8.6}
      pcbX={-4.5}
      pcbY={16}
    />

    {/* Board supplies feed the MCU's ordinary placement group. */}
    <trace
      name="PWR_LED_3V3"
      from="net.V3V3"
      to=".R_PWR_LED > .pin1"
      {...v3v3Label}
    />
    <trace name="PWR_LED_D" from=".R_PWR_LED > .pin2" to=".D_PWR > .anode" />
    <trace
      name="PWR_LED_GND"
      from=".D_PWR > .cathode"
      to="net.GND"
      {...groundPlaneTraceProps}
    />
    <trace
      name="RGB_BUF_VBUS"
      from=".U_RGB_BUF > .VCC"
      to=".C_RGB_BUF > .pin1"
      {...vbusLabel}
      {...powerTraceProps}
    />
    <trace
      name="RGB_VBUS_DISTRIBUTION"
      from=".U_RGB_BUF > .VCC"
      to=".D_RGB > .VDD"
      {...vbusLabel}
      {...powerTraceProps}
    />
    <trace
      name="RGB_BUF_DECOUPLING_VBUS"
      from=".U_RGB_BUF > .VCC"
      to="net.VBUS"
      {...vbusLabel}
    />
    <trace
      name="RGB_BUF_GND"
      from=".U_RGB_BUF > .GND"
      to=".C_RGB_BUF > .pin2"
      {...gndLabel}
      thickness="0.1mm"
    />
    <trace
      name="RGB_BUF_OE"
      from=".U_RGB_BUF > .OE"
      to=".C_RGB_BUF > .pin2"
      {...gndLabel}
      thickness="0.1mm"
    />
    <trace
      name="RGB_BUF_DECOUPLING_GND"
      from=".C_RGB_BUF > .pin2"
      to="net.GND"
      {...groundPlaneTraceProps}
    />
    <trace
      name="RGB_GPIO15"
      from=".MCU_CORE .U1 > .GPIO15"
      to=".U_RGB_BUF > .A"
    />
    <trace
      name="RGB_BUFFERED_DATA"
      from=".U_RGB_BUF > .Y"
      to=".R_RGB_DATA > .pin1"
    />
    <trace name="RGB_DATA_IN" from=".R_RGB_DATA > .pin2" to=".D_RGB > .DI" />
    <trace
      name="RGB_VBUS"
      from=".D_RGB > .VDD"
      to=".C_RGB > .pin1"
      {...vbusLabel}
      {...powerTraceProps}
    />
    <trace
      name="RGB_DECOUPLING_VBUS"
      from=".D_RGB > .VDD"
      to="net.VBUS"
      {...vbusLabel}
      {...powerTraceProps}
    />
    <trace
      name="RGB_GND"
      from=".D_RGB > .GND"
      to=".C_RGB > .pin2"
      {...gndLabel}
      {...powerTraceProps}
    />
    <trace
      name="RGB_DECOUPLING_GND"
      from=".D_RGB > .GND"
      to="net.GND"
      {...gndLabel}
      {...powerTraceProps}
    />
    {/* Reset, USB-C, and SWD connect to the ordinary MCU placement group. */}
    <trace name="RUN_PULLUP" from=".R_RUN > .pin1" to=".MCU_CORE .U1 > .RUN" />
    <trace
      name="RUN_PULLUP_3V3"
      from=".R_RUN > .pin2"
      to="net.V3V3"
      {...v3v3Label}
    />
    <trace name="RUN_SWITCH" from=".U_RUN > .pin1" to=".MCU_CORE .U1 > .RUN" />
    <trace
      name="RUN_SWITCH_GND"
      from=".U_RUN > .pin3"
      to="net.GND"
      {...groundPlaneTraceProps}
    />
    <trace name="VBUS_A" from=".J_USB > .A4B9" to="net.VBUS" {...vbusLabel} />
    <trace name="VBUS_B" from=".J_USB > .B4A9" to="net.VBUS" {...vbusLabel} />
    <trace
      name="C_VBUS_P"
      from=".C_VBUS > .pin1"
      to="net.VBUS"
      {...vbusLabel}
    />
    <trace
      name="C_VBUS_G"
      from=".C_VBUS > .pin2"
      to="net.GND"
      {...groundPlaneTraceProps}
    />
    <trace
      name="USB_DM_A"
      from=".J_USB > .A7"
      to="net.USB_DM_OUT"
      {...denseTraceProps}
    />
    <trace
      name="USB_DM_B"
      from=".J_USB > .B7"
      to="net.USB_DM_OUT"
      {...denseTraceProps}
    />
    <trace
      name="USB_DP_A"
      from=".J_USB > .A6"
      to="net.USB_DP_OUT"
      {...denseTraceProps}
    />
    <trace
      name="USB_DP_B"
      from=".J_USB > .B6"
      to="net.USB_DP_OUT"
      {...denseTraceProps}
    />
    <trace name="CC1" from=".J_USB > .A5" to=".R_CC1 > .pin1" />
    <trace name="CC2" from=".J_USB > .B5" to=".R_CC2 > .pin1" />
    <trace
      name="CC1_GND"
      from=".R_CC1 > .pin2"
      to="net.GND"
      {...groundPlaneTraceProps}
    />
    <trace
      name="CC2_GND"
      from=".R_CC2 > .pin2"
      to="net.GND"
      {...groundPlaneTraceProps}
    />
    <trace
      name="USB_GND_A"
      from=".J_USB > .A1B12"
      to="net.GND"
      {...groundPlaneTraceProps}
    />
    <trace
      name="USB_GND_B"
      from=".J_USB > .B1A12"
      to="net.GND"
      {...groundPlaneTraceProps}
    />
    <trace
      name="USB_SHIELD_1"
      from=".J_USB > .EH1"
      to="net.GND"
      {...groundPlaneTraceProps}
    />
    <trace
      name="USB_SHIELD_1_ALT"
      from=".J_USB > .pin13_alt1"
      to=".J_USB > .EH1"
      {...gndLabel}
      thickness="0.1mm"
    />
    <trace
      name="USB_SHIELD_2"
      from=".J_USB > .EH2"
      to="net.GND"
      {...groundPlaneTraceProps}
    />
    <trace
      name="USB_SHIELD_2_ALT"
      from=".J_USB > .pin14_alt1"
      to=".J_USB > .EH2"
      {...gndLabel}
      thickness="0.1mm"
    />
    <trace name="SWDIO" from=".MCU_CORE .U1 > .SWDIO" to=".TP_SWDIO > .pin1" />
    <trace
      name="T_TP_GND"
      from=".TP_GND > .pin1"
      to="net.GND"
      {...groundPlaneTraceProps}
    />
    <trace
      name="T_TP_3V3"
      from=".TP_3V3 > .pin1"
      to="net.V3V3"
      {...v3v3Label}
    />
    {headers &&
      leftHeaderSignals.map((signal, index) =>
        signal === "V3V3_EN" ? null : (
          <Fragment key={`left-${index + 1}`}>
            <trace
              name={`LEFT_${index + 1}_${signal}`}
              from={`.J_LEFT > .pin${index + 1}`}
              to={
                signal === "GND"
                  ? "net.GND"
                  : signal === "V3V3"
                    ? "net.V3V3"
                    : `.MCU_CORE .U1 > .${signal}`
              }
              {...(signal === "GND"
                ? groundPlaneTraceProps
                : signal === "V3V3"
                  ? v3v3Label
                  : signalTraceProps)}
            />
          </Fragment>
        ),
      )}

    {headers &&
      rightHeaderSignals.map((signal, index) => (
        <Fragment key={`right-${index + 1}`}>
          <trace
            name={`RIGHT_${index + 1}_${signal}`}
            from={`.J_RIGHT > .pin${index + 1}`}
            to={
              signal === "GND"
                ? "net.GND"
                : signal === "V3V3"
                  ? "net.V3V3"
                  : signal === "VBUS"
                    ? "net.VBUS"
                    : `.MCU_CORE .U1 > .${signal}`
            }
            {...(signal === "GND"
              ? groundPlaneTraceProps
              : signal === "V3V3"
                ? v3v3Label
                : signal === "VBUS"
                  ? vbusLabel
                  : signalTraceProps)}
          />
        </Fragment>
      ))}

    <trace
      name="STEMMA_QT_GND"
      from=".J_STEMMA_QT > .GND"
      to="net.GND"
      {...groundPlaneTraceProps}
    />
    <trace
      name="STEMMA_QT_3V3_ENTRY"
      from=".J_STEMMA_QT > .V3V3"
      to=".R_STEMMA_POWER > .pin2"
      {...powerTraceProps}
    />
    <trace
      name="STEMMA_QT_3V3"
      from=".R_STEMMA_POWER > .pin1"
      to="net.V3V3"
      {...v3v3Label}
      {...powerTraceProps}
    />
    <trace
      name="STEMMA_QT_SDA"
      from=".J_STEMMA_QT > .SDA"
      to=".MCU_CORE .U1 > .GPIO2"
      {...signalTraceProps}
    />
    <trace
      name="STEMMA_QT_SCL"
      from=".J_STEMMA_QT > .SCL"
      to=".MCU_CORE .U1 > .GPIO3"
      {...signalTraceProps}
    />
    <trace
      name="SPI_JST_GND"
      from=".J_SPI > .GND"
      to="net.GND"
      {...groundPlaneTraceProps}
    />
    <trace
      name="SPI_JST_3V3"
      from=".J_SPI > .V3V3"
      to="net.V3V3"
      {...v3v3Label}
      {...powerTraceProps}
    />
    <trace
      name="SPI_JST_SCK"
      from=".J_SPI > .SCK"
      to=".MCU_CORE .U1 > .GPIO18"
      {...signalTraceProps}
    />
    <trace
      name="SPI_JST_MOSI"
      from=".J_SPI > .MOSI"
      to=".MCU_CORE .U1 > .GPIO19"
      {...signalTraceProps}
    />
    <trace
      name="SPI_JST_MISO"
      from=".J_SPI > .MISO"
      to=".MCU_CORE .U1 > .GPIO16"
      {...signalTraceProps}
    />
    <trace
      name="SPI_JST_CS"
      from=".J_SPI > .CS"
      to=".MCU_CORE .U1 > .GPIO17"
      {...signalTraceProps}
    />

    <silkscreentext text="RP2350A" fontSize="1mm" pcbX={-3} pcbY={-11} />
    <silkscreentext text="USB-C" fontSize="0.7mm" pcbX={-8} pcbY={-28} />
    <silkscreentext text="PWR" fontSize="0.65mm" pcbX={-9.5} pcbY={-24.4} />
    <silkscreentext text="RGB GP15" fontSize="0.65mm" pcbX={0} pcbY={24.9} />
    <silkscreentext text="STEMMA QT" fontSize="0.6mm" pcbX={5} pcbY={25} />
    <silkscreentext text="SPI JST" fontSize="0.6mm" pcbX={-5} pcbY={25} />
    <silkscreentext text="RESET" fontSize="0.65mm" pcbX={-6} pcbY={-18.4} />
    <silkscreentext text="BOOT" fontSize="0.65mm" pcbX={6} pcbY={-18.4} />
    <silkscreentext text="SWDIO" fontSize="0.45mm" pcbX={-8} pcbY={14.8} />
    <silkscreentext text="CLK" fontSize="0.45mm" pcbX={-5.5} pcbY={14.8} />
    <silkscreentext text="GND" fontSize="0.45mm" pcbX={-3} pcbY={14.8} />
    <silkscreentext text="3V3" fontSize="0.45mm" pcbX={-0.5} pcbY={14.8} />
    <silkscreentext text="SWD" fontSize="0.65mm" pcbX={-5.5} pcbY={18} />
  </group>
)

export default RP2350CompactLayout
