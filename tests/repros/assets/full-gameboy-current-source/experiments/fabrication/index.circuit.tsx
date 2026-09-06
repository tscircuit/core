import { AudioAmplifier3W_PAM8403, PowerBoost_MT3608 } from "@tscircuit/common"
import { LCDWiki_2_8_SPI_ILI9341_MSP2807 } from "./LCDWiki_2_8_SPI_ILI9341_MSP2807"
import { KH_6X6X15H_SMT_FS_D } from "./imports/KH_6X6X15H_SMT_FS_D"
import { SK_12E12_G5 } from "../../imports/SK_12E12_G5"
import {
  Microcontroller_RP2350,
  type McuPlacement,
} from "./Microcontroller_RP2350.circuit"
import { AP2112K_3_3TRG1 } from "../../imports/AP2112K_3_3TRG1"
import { SS34 } from "../../imports/SS34"
import { AudioAmplifier_EdgeLayout } from "./AudioAmplifier_EdgeLayout.circuit"
import { AudioAmplifier_GlobalLayout } from "./AudioAmplifier_GlobalLayout.circuit"
import { PowerBoost_GlobalLayout } from "./PowerBoost_GlobalLayout.circuit"
import { RP2350CompactLayout } from "./published-rp2350-v0.0.11/pico-layout.circuit"
import { MicroSDStorage } from "./MicroSD_Storage.circuit"

const denseTraceProps = { thickness: "0.1mm" } as const
const batteryTraceProps = { thickness: "0.3mm" } as const
const powerTraceProps = { thickness: "0.4mm" } as const
const gndLabel = { displayName: "GND", schDisplayLabel: "GND" } as const
const v3v3Label = { displayName: "V3V3", schDisplayLabel: "V3V3" } as const
const vsysLabel = { displayName: "VSYS", schDisplayLabel: "VSYS" } as const
const vbusLabel = { displayName: "VBUS", schDisplayLabel: "VBUS" } as const

const schSections = {
  power: "power",
  controls: "controls",
  display: "display",
} as const

export default ({
  mcuSubcircuit = false,
  publishedMcuModule = false,
  storage = false,
  psramCapEscape = false,
  mcuPassiveEscape = false,
  clockPassiveEscape = false,
  westDecouplerEscape = false,
  eastSupplyCapEscape = false,
  clockResistorEscape = false,
  sdDetectEscape = false,
  debugTestpointEscape = false,
  flashCapEscape = false,
  usbResistorEscape = false,
  segmentedSupplyPours = false,
  mcuHeaders = true,
  allGlobal = false,
  innerButtonContacts = false,
  layers = 2,
  copperIslands = true,
  routeClockFirst = false,
  routeHighSpeedFirst = false,
  routeDecouplingFirst = false,
  routeRegulatorFirst = false,
  routeSupplyNetsFirst = false,
  routeDisplayFirst = false,
  feedMcuAtInputCap = false,
  routingSafetyMargin = false,
  router = "beta-pipeline9",
  edgeConnectors = false,
  spreadMcuPassives = false,
  compactCoreIsland = false,
  coreIslandOffsetX = 0,
  coreIslandOffsetY = 0,
  coreIslandRotation = 0,
  clearUsbEscape = false,
  mcuPlacements,
  audioVrefPlacement,
  ldoOffset = { x: 0, y: 0 },
  ldoFlipped = false,
  ldoPlacements,
  usbDiodeOffset = { x: 0, y: 0 },
  powerOffsetX = 0,
  powerOffsetY = 0,
  powerPlacements,
  audioOffsetX = 0,
  audioPlacements,
  topLeftMountingHole = { x: -50, y: -32 },
  powerSwitchX = 60,
  effort,
}: {
  mcuSubcircuit?: boolean
  publishedMcuModule?: boolean
  storage?: boolean
  psramCapEscape?: boolean
  mcuPassiveEscape?: boolean
  clockPassiveEscape?: boolean
  westDecouplerEscape?: boolean
  eastSupplyCapEscape?: boolean
  clockResistorEscape?: boolean
  sdDetectEscape?: boolean
  debugTestpointEscape?: boolean
  flashCapEscape?: boolean
  usbResistorEscape?: boolean
  segmentedSupplyPours?: boolean
  mcuHeaders?: boolean
  allGlobal?: boolean
  innerButtonContacts?: boolean
  layers?: 2 | 4
  copperIslands?: boolean
  routeClockFirst?: boolean
  routeHighSpeedFirst?: boolean
  routeDecouplingFirst?: boolean
  routeRegulatorFirst?: boolean
  routeSupplyNetsFirst?: boolean
  routeDisplayFirst?: boolean
  feedMcuAtInputCap?: boolean
  routingSafetyMargin?: boolean
  router?: "auto" | "beta-pipeline9"
  edgeConnectors?: boolean
  spreadMcuPassives?: boolean
  compactCoreIsland?: boolean
  coreIslandOffsetX?: number
  coreIslandOffsetY?: number
  coreIslandRotation?: 0 | 90 | 180 | 270
  clearUsbEscape?: boolean
  mcuPlacements?: Partial<Record<string, McuPlacement>>
  audioVrefPlacement?: { pcbX: number; pcbY: number; pcbRotation: number }
  audioPlacements?: Partial<
    Record<
      | "R_AMP_IN"
      | "C_AMP_PWM_FILTER"
      | "C_AMP_IN_COUPLE"
      | "C_AMP_VDD"
      | "C_AMP_VDD_BULK"
      | "FB_SPK_POS",
      { pcbX: number; pcbY: number; pcbRotation: number }
    >
  >
  ldoOffset?: { x: number; y: number }
  ldoFlipped?: boolean
  ldoPlacements?: Partial<
    Record<
      "U_3V3" | "C_3V3_IN" | "C_3V3_OUT",
      { pcbX: number; pcbY: number; pcbRotation: number }
    >
  >
  usbDiodeOffset?: { x: number; y: number }
  powerOffsetX?: number
  powerOffsetY?: number
  powerPlacements?: Partial<
    Record<
      | "R_BOOST_EN_PULLUP"
      | "R_BAT_GATE_PULLUP"
      | "D_BAT_BOOST"
      | "C_BAT_OUT"
      | "C_BAT_OUT_BULK"
      | "R_BOOST_TOP"
      | "R_BOOST_BOT"
      | "R_USB_BOOST_OFF"
      | "Q_USB_BOOST_OFF"
      | "R_USB_BOOST_OFF_PULLDOWN",
      { pcbX: number; pcbY: number; pcbRotation: number }
    >
  >
  audioOffsetX?: number
  topLeftMountingHole?: { x: number; y: number }
  powerSwitchX?: number
  effort?: "1x" | "2x" | "5x" | "10x" | "100x"
} = {}) => (
  <board
    title="Game Boy Advance RP2350 handheld circuit"
    autorouter={router}
    autorouterEffortLevel={effort}
    width="144.5mm"
    height="87.5mm"
    thickness="0.8mm"
    layers={layers}
    minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.45mm"
    minViaEdgeToPadEdgeClearance="0.1mm"
    minViaHoleEdgeToViaHoleEdgeClearance="0.2mm"
    minPlatedHoleDrillEdgeToDrillEdgeClearance="0.45mm"
    minTraceToPadEdgeClearance="0.1mm"
    minPadEdgeToPadEdgeClearance="0.1mm"
    outline={[
      { x: -66, y: -43.5 },
      { x: 66, y: -43.5 },
      { x: 69.5, y: -42 },
      { x: 71.5, y: -39 },
      { x: 72.25, y: -34.5 },
      { x: 72.25, y: 18 },
      { x: 70.5, y: 26 },
      { x: 67, y: 33 },
      { x: 61, y: 38 },
      { x: 53, y: 41 },
      { x: -53, y: 41 },
      { x: -61, y: 38 },
      { x: -67, y: 33 },
      { x: -70.5, y: 26 },
      { x: -72.25, y: 18 },
      { x: -72.25, y: -34.5 },
      { x: -71.5, y: -39 },
      { x: -69.5, y: -42 },
    ]}
  >
    <schematicrect
      schX={0}
      schY={-10}
      width={84}
      height={28}
      strokeWidth={0.08}
      color="#777777"
    />
    <schematictext
      text="RP2350 + USB-C"
      schX={-40.6}
      schY={-22.4}
      fontSize={1.4}
      anchor="top_left"
      color="#333333"
    />
    <schematicrect
      schX={-27}
      schY={16}
      width={30}
      height={24}
      strokeWidth={0.08}
      color="#777777"
    />
    <schematictext
      text="Power"
      schX={-40.6}
      schY={5.6}
      fontSize={1.4}
      anchor="top_left"
      color="#333333"
    />
    <schematicrect
      schX={-2}
      schY={16}
      width={20}
      height={24}
      strokeWidth={0.08}
      color="#777777"
    />
    <schematictext
      text="Display"
      schX={-10.6}
      schY={5.6}
      fontSize={1.4}
      anchor="top_left"
      color="#333333"
    />
    <schematicrect
      schX={25}
      schY={16}
      width={34}
      height={24}
      strokeWidth={0.08}
      color="#777777"
    />
    <schematictext
      text="Audio"
      schX={9.4}
      schY={5.6}
      fontSize={1.4}
      anchor="top_left"
      color="#333333"
    />
    <schematicrect
      schX={-27}
      schY={40}
      width={30}
      height={24}
      strokeWidth={0.08}
      color="#777777"
    />
    <schematictext
      text="Controls"
      schX={-40.6}
      schY={29.6}
      fontSize={1.4}
      anchor="top_left"
      color="#333333"
    />

    <net name="GND" isGroundNet />
    <net
      name="V3V3"
      isPowerNet
      routingPhaseIndex={
        routeSupplyNetsFirst ? (routeHighSpeedFirst ? 2 : 1) : undefined
      }
    />
    <net name="VSYS" isPowerNet />
    <net name="VBUS" isPowerNet />
    <net name="BAT_POS" isPowerNet />
    <net name="BAT_SWITCHED" isPowerNet />
    <net name="AUDIO_PWM" />

    {routeClockFirst && (
      <autoroutingphase
        name="MCU_CLOCK_FIRST"
        phaseIndex={0}
        autorouter={router}
      />
    )}

    {routeDisplayFirst && (
      <autoroutingphase
        name="DISPLAY_BUS_FIRST"
        phaseIndex={0}
        autorouter={router}
      />
    )}

    {routingSafetyMargin && (
      <autoroutingphase
        name="GLOBAL_WITH_ROUTING_MARGIN"
        autorouter={router}
        minTraceToPadEdgeClearance="0.15mm"
        minViaEdgeToPadEdgeClearance="0.2mm"
      />
    )}

    {routeSupplyNetsFirst && (
      <autoroutingphase
        name="SUPPLY_NETS_FIRST"
        phaseIndex={routeHighSpeedFirst ? 2 : 1}
        autorouter={router}
        minTraceToPadEdgeClearance="0.15mm"
        minViaEdgeToPadEdgeClearance="0.2mm"
      />
    )}

    {routeRegulatorFirst && (
      <autoroutingphase
        name="MCU_REGULATOR_FIRST"
        phaseIndex={1}
        autorouter={router}
      />
    )}

    {routeDecouplingFirst && (
      <autoroutingphase
        name="MCU_DECOUPLING_FIRST"
        phaseIndex={1}
        autorouter={router}
      />
    )}

    {routeHighSpeedFirst && (
      <autoroutingphase
        name="MCU_FLASH_USB_FIRST"
        phaseIndex={1}
        autorouter={router}
      />
    )}

    <hole
      name="MH_TOP_LEFT"
      diameter="3.3mm"
      pcbX={topLeftMountingHole.x}
      pcbY={topLeftMountingHole.y}
    />
    <hole name="MH_TOP_RIGHT" diameter="3.3mm" pcbX={50} pcbY={-32} />
    <hole name="MH_BOTTOM_LEFT" diameter="3.3mm" pcbX={-60} pcbY={31} />
    <hole name="MH_BOTTOM_RIGHT" diameter="3.3mm" pcbX={60} pcbY={31} />

    {publishedMcuModule ? (
      <RP2350CompactLayout
        name="MCU"
        subcircuit={mcuSubcircuit}
        psram={storage}
        psramCapEscape={psramCapEscape}
        mcuPassiveEscape={mcuPassiveEscape}
        clockPassiveEscape={clockPassiveEscape}
        westDecouplerEscape={westDecouplerEscape}
        eastSupplyCapEscape={eastSupplyCapEscape}
        clockRoutingPhase={routeClockFirst ? 0 : undefined}
        clockResistorEscape={clockResistorEscape}
        debugTestpointEscape={debugTestpointEscape}
        flashCapEscape={flashCapEscape}
        usbResistorEscape={usbResistorEscape}
        segmentedSupplyPours={segmentedSupplyPours}
        headers={mcuHeaders}
        pcbX={0}
        pcbY={0}
        pcbRotation={0}
      />
    ) : (
      <Microcontroller_RP2350
        name="MCU"
        subcircuit={mcuSubcircuit}
        clockRoutingPhase={routeClockFirst ? 0 : undefined}
        highSpeedRoutingPhase={routeHighSpeedFirst ? 1 : undefined}
        decouplingRoutingPhase={routeDecouplingFirst ? 1 : undefined}
        regulatorRoutingPhase={routeRegulatorFirst ? 1 : undefined}
        supplyRoutingPhase={
          routeSupplyNetsFirst ? (routeHighSpeedFirst ? 2 : 1) : undefined
        }
        spreadPassives={spreadMcuPassives}
        compactCoreIsland={compactCoreIsland}
        clearUsbEscape={clearUsbEscape}
        placements={mcuPlacements}
        pcbRotation={180}
        pcbX={0}
        pcbY={17}
      />
    )}

    {allGlobal ? (
      <PowerBoost_GlobalLayout
        name="POWER"
        placements={powerPlacements}
        pcbX={(edgeConnectors ? -34 : -32) + powerOffsetX}
        pcbY={-53 + powerOffsetY}
        schX={-29}
        schY={15}
      />
    ) : (
      <PowerBoost_MT3608
        name="POWER"
        exposedNets={["BAT_POS", "BAT_SWITCHED", "VBUS", "VSYS", "GND"]}
        pcbX={(edgeConnectors ? -34 : -32) + powerOffsetX}
        pcbY={-53 + powerOffsetY}
        schX={-29}
        schY={15}
      />
    )}

    <trace
      name="USB_VBUS_TO_POWER"
      from={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_RIGHT > .pin22"
            : ".MCU .J_USB > .A4B9"
          : ".MCU .J_USB > .A4B9"
      }
      to="net.VBUS"
      {...powerTraceProps}
      {...vbusLabel}
    />
    <trace
      name="MCU_GND"
      from={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_RIGHT > .pin3"
            : ".MCU .MCU_CORE .U1 > .GND"
          : ".MCU .U1 > .GND"
      }
      to="net.GND"
      {...gndLabel}
    />
    <trace
      name="MCU_V3V3"
      from={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_RIGHT > .pin21"
            : ".MCU .MCU_CORE .U1 > .VREG_VIN"
          : feedMcuAtInputCap
            ? ".MCU .C_VREG_IN > .pin1"
            : ".MCU .U1 > .VREG_VIN"
      }
      to="net.V3V3"
      {...powerTraceProps}
      {...v3v3Label}
    />

    {/* USB feeds VSYS through a diode; the common power circuit disables
        its battery boost when VBUS is present. The diode blocks backfeed. */}
    <SS34
      name="D_USB_POWER"
      pcbX={-16 + usbDiodeOffset.x}
      pcbY={32 + usbDiodeOffset.y}
      schX={-29}
      schY={24}
    />
    <trace
      name="USB_POWER_IN"
      from="net.VBUS"
      to=".D_USB_POWER > .anode"
      {...powerTraceProps}
    />
    <trace
      name="USB_POWER_OUT"
      from=".D_USB_POWER > .cathode"
      to="net.VSYS"
      {...powerTraceProps}
    />

    {/* The MCU's internal regulator only generates 1.1 V; its I/O and
        regulator input require this external 3.3 V supply. */}
    <AP2112K_3_3TRG1
      name="U_3V3"
      pcbX={-19 + ldoOffset.x}
      pcbY={19 + ldoOffset.y}
      pcbRotation={ldoFlipped ? 0 : 180}
      schX={-21}
      schY={23}
      noConnect={["NC"]}
      {...ldoPlacements?.U_3V3}
    />
    <capacitor
      name="C_3V3_IN"
      capacitance="1uF"
      maxDecouplingTraceLength="5.5mm"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C15849"] }}
      pcbX={(ldoFlipped ? -14.8 : -23.2) + ldoOffset.x}
      pcbY={(ldoFlipped ? 18 : 20) + ldoOffset.y}
      pcbRotation={ldoFlipped ? 0 : 180}
      schX={-25}
      schY={24.5}
      {...ldoPlacements?.C_3V3_IN}
    />
    <capacitor
      name="C_3V3_OUT"
      capacitance="1uF"
      maxDecouplingTraceLength="5.5mm"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C15849"] }}
      pcbX={(ldoFlipped ? -20.1 : -17.9) + ldoOffset.x}
      pcbY={(ldoFlipped ? 15.5 : 22.5) + ldoOffset.y}
      pcbRotation={ldoFlipped ? 270 : 90}
      schX={-17}
      schY={24.5}
      {...ldoPlacements?.C_3V3_OUT}
    />
    <trace
      name="REG_3V3_IN"
      from="net.VSYS"
      to=".U_3V3 > .VIN"
      {...powerTraceProps}
    />
    <trace name="REG_3V3_ENABLE" from=".U_3V3 > .EN" to="net.VSYS" />
    <trace name="REG_3V3_GND" from=".U_3V3 > .GND" to="net.GND" />
    <trace
      name="REG_3V3_OUT"
      from=".U_3V3 > .VOUT"
      to="net.V3V3"
      {...powerTraceProps}
    />
    <trace
      name="REG_3V3_INPUT_CAP"
      routingPhaseIndex={routeDecouplingFirst ? 1 : undefined}
      from=".C_3V3_IN > .pin1"
      to=".U_3V3 > .VIN"
      maxLength="5.5mm"
    />
    <trace
      name="REG_3V3_INPUT_CAP_GND"
      from=".C_3V3_IN > .pin2"
      to="net.GND"
      maxLength="30mm"
    />
    <trace
      name="REG_3V3_OUTPUT_CAP"
      routingPhaseIndex={routeDecouplingFirst ? 1 : undefined}
      from=".C_3V3_OUT > .pin1"
      to=".U_3V3 > .VOUT"
      maxLength="5.5mm"
    />
    <trace
      name="REG_3V3_OUTPUT_CAP_GND"
      from=".C_3V3_OUT > .pin2"
      to="net.GND"
    />

    {edgeConnectors ? (
      allGlobal ? (
        <AudioAmplifier_GlobalLayout
          name="AUDIO"
          vrefPlacement={audioVrefPlacement}
          placements={audioPlacements}
          pcbX={14 + audioOffsetX}
          pcbY={13}
          pcbRotation={0}
          schX={25}
          schY={12}
        />
      ) : (
        <AudioAmplifier_EdgeLayout
          name="AUDIO"
          exposedNets={["AUDIO_PWM", "V3V3", "VSYS", "GND"]}
          pcbX={14 + audioOffsetX}
          pcbY={13}
          pcbRotation={0}
          schX={25}
          schY={12}
        />
      )
    ) : (
      <AudioAmplifier3W_PAM8403
        name="AUDIO"
        exposedNets={["AUDIO_PWM", "V3V3", "VSYS", "GND"]}
        pcbX={29 + audioOffsetX}
        pcbY={-30}
        pcbRotation={90}
        schX={25}
        schY={12}
      />
    )}
    <trace
      name="AUDIO_SIGNAL"
      from={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_RIGHT > .pin16"
            : ".MCU .MCU_CORE .U1 > .GPIO12"
          : ".MCU .U1 > .GPIO22"
      }
      to="net.AUDIO_PWM"
    />

    <LCDWiki_2_8_SPI_ILI9341_MSP2807
      name="J_LCD"
      schSectionName={schSections.display}
      layer="top"
      pcbX={0}
      pcbY={1}
      schX={-2}
      schY={16}
    />

    {storage && publishedMcuModule && (
      <group name="STORAGE" schX={26} schY={32}>
        <MicroSDStorage
          name="SD"
          pcbX={34}
          pcbY={-33.7}
          pcbRotation={180}
          sdDetectEscape={sdDetectEscape}
        />
        <trace
          name="SD_SCK"
          from=".SD .J_SD > .CLK"
          to={
            mcuHeaders
              ? ".MCU .J_LEFT > .pin17"
              : ".MCU .MCU_CORE .U1 > .GPIO18"
          }
        />
        <trace
          name="SD_MOSI"
          from=".SD .J_SD > .MOSI"
          to={
            mcuHeaders
              ? ".MCU .J_LEFT > .pin15"
              : ".MCU .MCU_CORE .U1 > .GPIO19"
          }
        />
        <trace
          name="SD_MISO"
          from=".SD .J_SD > .MISO"
          to={
            mcuHeaders
              ? ".MCU .J_LEFT > .pin19"
              : ".MCU .MCU_CORE .U1 > .GPIO16"
          }
        />
        <trace
          name="SD_CS"
          from=".SD .J_SD > .CS"
          to={
            mcuHeaders ? ".MCU .J_RIGHT > .pin2" : ".MCU .MCU_CORE .U1 > .GPIO1"
          }
        />
        <trace
          name="SD_CARD_DETECT"
          from=".SD .J_SD > .CD"
          to={
            mcuHeaders
              ? ".MCU .J_RIGHT > .pin19"
              : ".MCU .MCU_CORE .U1 > .GPIO14"
          }
        />
      </group>
    )}

    <hole
      name="BAT_CABLE_SLOT_STRAIGHT"
      shape="pill"
      width="5mm"
      height="11mm"
      pcbX="-66mm"
      pcbY="25mm"
    />
    <SK_12E12_G5
      name="J_PWR_SW"
      schSectionName={schSections.power}
      pcbX={powerSwitchX}
      pcbY={-30}
      pcbRotation={0}
      schX={-33}
      schY={8}
      schHeight={0.6}
      noConnect={["pin3"]}
    />
    <trace
      name="BATTERY_TO_SWITCH"
      from="net.BAT_POS"
      to=".J_PWR_SW > .pin1"
      {...batteryTraceProps}
    />
    <trace
      name="SWITCH_TO_BOOST"
      from=".J_PWR_SW > .pin2"
      to="net.BAT_SWITCHED"
      {...batteryTraceProps}
    />

    <KH_6X6X15H_SMT_FS_D
      name="SW_UP"
      schSectionName={schSections.controls}
      pcbX={-64}
      pcbY={-7}
      schX={-36}
      schY={31}
    />
    <KH_6X6X15H_SMT_FS_D
      name="SW_DOWN"
      schSectionName={schSections.controls}
      pcbX={-64}
      pcbY={7}
      schX={-36}
      schY={34}
    />
    <KH_6X6X15H_SMT_FS_D
      name="SW_LEFT"
      schSectionName={schSections.controls}
      pcbX={-52}
      pcbY={7}
      schX={-36}
      schY={37}
    />
    <KH_6X6X15H_SMT_FS_D
      name="SW_RIGHT"
      schSectionName={schSections.controls}
      pcbX={-52}
      pcbY={-8}
      schX={-36}
      schY={40}
    />
    <KH_6X6X15H_SMT_FS_D
      name="SW_A"
      schSectionName={schSections.controls}
      pcbX={64}
      pcbY={-7}
      schX={-27}
      schY={31}
    />
    <KH_6X6X15H_SMT_FS_D
      name="SW_B"
      schSectionName={schSections.controls}
      pcbX={64}
      pcbY={7}
      schX={-27}
      schY={34}
    />
    <KH_6X6X15H_SMT_FS_D
      name="SW_X"
      schSectionName={schSections.controls}
      pcbX={52}
      pcbY={-7}
      schX={-27}
      schY={37}
    />
    <KH_6X6X15H_SMT_FS_D
      name="SW_Y"
      schSectionName={schSections.controls}
      pcbX={52}
      pcbY={7}
      schX={-27}
      schY={40}
    />
    <KH_6X6X15H_SMT_FS_D
      name="SW_SELECT"
      schSectionName={schSections.controls}
      pcbX={-50}
      pcbY={27}
      schX={-31.5}
      schY={43}
    />
    <KH_6X6X15H_SMT_FS_D
      name="SW_START"
      schSectionName={schSections.controls}
      pcbX={50}
      pcbY={27}
      schX={-27}
      schY={43}
    />

    {/* Keep left-side controls on the left MCU header to avoid unnecessary
        cross-board routes. The RP2350 GPIOs remain ordinary digital inputs. */}
    <trace
      name="UP"
      from={innerButtonContacts ? ".SW_UP > .pin2" : ".SW_UP > .pin1"}
      to={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_LEFT > .pin8"
            : ".MCU .MCU_CORE .U1 > .GPIO25"
          : ".MCU .U1 > .GPIO2"
      }
    />
    <trace name="UP_G" from=".SW_UP > .pin4" to="net.GND" {...gndLabel} />
    <trace
      name="DN"
      from={innerButtonContacts ? ".SW_DOWN > .pin2" : ".SW_DOWN > .pin1"}
      to={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_LEFT > .pin9"
            : ".MCU .MCU_CORE .U1 > .GPIO24"
          : ".MCU .U1 > .GPIO3"
      }
    />
    <trace name="DN_G" from=".SW_DOWN > .pin4" to="net.GND" {...gndLabel} />
    <trace
      name="LFT"
      from={innerButtonContacts ? ".SW_LEFT > .pin2" : ".SW_LEFT > .pin1"}
      to={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_LEFT > .pin10"
            : ".MCU .MCU_CORE .U1 > .GPIO23"
          : ".MCU .U1 > .GPIO4"
      }
    />
    <trace name="LFT_G" from=".SW_LEFT > .pin4" to="net.GND" {...gndLabel} />
    <trace
      name="RGT"
      from={innerButtonContacts ? ".SW_RIGHT > .pin2" : ".SW_RIGHT > .pin1"}
      to={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_LEFT > .pin6"
            : ".MCU .MCU_CORE .U1 > .GPIO26_ADC0"
          : ".MCU .U1 > .GPIO5"
      }
    />
    <trace name="RGT_G" from=".SW_RIGHT > .pin4" to="net.GND" {...gndLabel} />
    <trace
      name="A"
      from=".SW_A > .pin1"
      to={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_RIGHT > .pin9"
            : ".MCU .MCU_CORE .U1 > .GPIO6"
          : ".MCU .U1 > .GPIO6"
      }
    />
    <trace
      name="A_G"
      from={innerButtonContacts ? ".SW_A > .pin3" : ".SW_A > .pin4"}
      to="net.GND"
      {...gndLabel}
    />
    <trace
      name="B"
      from=".SW_B > .pin1"
      to={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_RIGHT > .pin10"
            : ".MCU .MCU_CORE .U1 > .GPIO7"
          : ".MCU .U1 > .GPIO7"
      }
    />
    <trace
      name="B_G"
      from={innerButtonContacts ? ".SW_B > .pin3" : ".SW_B > .pin4"}
      to="net.GND"
      {...gndLabel}
    />
    <trace
      name="X"
      from=".SW_X > .pin1"
      to={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_RIGHT > .pin11"
            : ".MCU .MCU_CORE .U1 > .GPIO8"
          : ".MCU .U1 > .GPIO8"
      }
    />
    <trace
      name="X_G"
      from={innerButtonContacts ? ".SW_X > .pin3" : ".SW_X > .pin4"}
      to="net.GND"
      {...gndLabel}
    />
    <trace
      name="Y"
      from=".SW_Y > .pin1"
      to={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_RIGHT > .pin12"
            : ".MCU .MCU_CORE .U1 > .GPIO9"
          : ".MCU .U1 > .GPIO9"
      }
    />
    <trace
      name="Y_G"
      from={innerButtonContacts ? ".SW_Y > .pin3" : ".SW_Y > .pin4"}
      to="net.GND"
      {...gndLabel}
    />
    <trace
      name="SEL"
      from={innerButtonContacts ? ".SW_SELECT > .pin2" : ".SW_SELECT > .pin1"}
      to={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_LEFT > .pin5"
            : ".MCU .MCU_CORE .U1 > .GPIO27_ADC1"
          : ".MCU .U1 > .GPIO10"
      }
    />
    <trace name="SEL_G" from=".SW_SELECT > .pin4" to="net.GND" {...gndLabel} />
    <trace
      name="STA"
      from=".SW_START > .pin1"
      to={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_RIGHT > .pin15"
            : ".MCU .MCU_CORE .U1 > .GPIO11"
          : ".MCU .U1 > .GPIO11"
      }
    />
    <trace
      name="STA_G"
      from={innerButtonContacts ? ".SW_START > .pin3" : ".SW_START > .pin4"}
      to="net.GND"
      {...gndLabel}
    />

    <trace
      name="LCD_VCC"
      from=".J_LCD .J_HEADER > .VCC"
      to="net.VSYS"
      {...powerTraceProps}
      {...vsysLabel}
    />
    <trace
      name="LCD_GND"
      from=".J_LCD .J_HEADER > .GND"
      to="net.GND"
      {...gndLabel}
    />
    <trace
      name="LCD_CS"
      routingPhaseIndex={routeDisplayFirst ? 0 : undefined}
      from=".J_LCD .J_HEADER > .CS"
      to={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_LEFT > .pin18"
            : ".MCU .MCU_CORE .U1 > .GPIO17"
          : ".MCU .U1 > .GPIO17"
      }
    />
    <trace
      name="LCD_RST"
      from=".J_LCD .J_HEADER > .RESET"
      to={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_LEFT > .pin13"
            : ".MCU .MCU_CORE .U1 > .GPIO21"
          : ".MCU .U1 > .GPIO21"
      }
    />
    <trace
      name="LCD_DC"
      from=".J_LCD .J_HEADER > .DC_RS"
      to={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_LEFT > .pin14"
            : ".MCU .MCU_CORE .U1 > .GPIO20"
          : ".MCU .U1 > .GPIO20"
      }
    />
    <trace
      name="LCD_MOSI"
      from=".J_LCD .J_HEADER > .SDI_MOSI"
      to={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_LEFT > .pin15"
            : ".MCU .MCU_CORE .U1 > .GPIO19"
          : ".MCU .U1 > .GPIO19"
      }
    />
    <trace
      name="LCD_SCK"
      from=".J_LCD .J_HEADER > .SCK"
      to={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_LEFT > .pin17"
            : ".MCU .MCU_CORE .U1 > .GPIO18"
          : ".MCU .U1 > .GPIO18"
      }
    />
    <trace
      name="LCD_LED"
      from=".J_LCD .J_HEADER > .LED"
      to="net.V3V3"
      {...v3v3Label}
    />
    <trace
      name="LCD_MISO"
      from=".J_LCD .J_HEADER > .SDO_MISO"
      to={
        publishedMcuModule
          ? mcuHeaders
            ? ".MCU .J_LEFT > .pin19"
            : ".MCU .MCU_CORE .U1 > .GPIO16"
          : ".MCU .U1 > .GPIO16"
      }
    />

    <trace name="SW_G" from=".J_PWR_SW > .pin4" to="net.GND" {...gndLabel} />
    <trace name="SW_G2" from=".J_PWR_SW > .pin5" to="net.GND" {...gndLabel} />

    <copperpour
      name="GND_POUR_TOP"
      connectsTo="net.GND"
      layer="top"
      clearance="0.18mm"
      boardEdgeMargin="0.25mm"
    />
    <copperpour
      name="GND_POUR_BOTTOM"
      connectsTo="net.GND"
      layer="bottom"
      clearance="0.18mm"
      boardEdgeMargin="0.25mm"
    />

    {/* Like the RP2350 reference, keep each supply region local to its
        regulator and capacitor. The optional inner-2 regions below reserve
        separate areas for the two supplies; all normal net traces remain. */}
    {segmentedSupplyPours && (
      <copperpour
        name="V3V3_DISTRIBUTION_INNER2"
        connectsTo="net.V3V3"
        layer="inner2"
        unbroken
        clearance="0.2mm"
        boardEdgeMargin="0.3mm"
        outline={[
          { x: -36, y: -18 },
          { x: -9, y: -18 },
          { x: -9, y: -41 },
          { x: 45, y: -41 },
          { x: 45, y: 30 },
          { x: -36, y: 30 },
        ]}
      />
    )}
    {segmentedSupplyPours && (
      <copperpour
        name="VSYS_POWER_INNER2"
        connectsTo="net.VSYS"
        layer="inner2"
        unbroken
        clearance="0.2mm"
        boardEdgeMargin="0.3mm"
        outline={[
          { x: -55, y: -41 },
          { x: -9.6, y: -41 },
          { x: -9.6, y: -18.6 },
          { x: -55, y: -18.6 },
        ]}
      />
    )}

    {/* Like the RP2350 reference, keep each supply region local to its
        regulator and capacitor. Coordinates are board coordinates. These
        pours supplement real net connections; no route is disabled. */}
    {copperIslands && (
      <copperpour
        name="V3V3_REGULATOR_ISLAND"
        connectsTo="net.V3V3"
        layer="top"
        clearance="0.18mm"
        boardEdgeMargin={0}
        outline={[
          { x: -18.5, y: 19.2 },
          { x: -17.3, y: 19.2 },
          { x: -17.3, y: 22.2 },
          { x: -18.5, y: 22.2 },
        ].map((point) => ({
          x: (ldoFlipped ? -38 - point.x : point.x) + ldoOffset.x,
          y: (ldoFlipped ? 38 - point.y : point.y) + ldoOffset.y,
        }))}
      />
    )}

    {copperIslands && !publishedMcuModule && (
      <copperpour
        name="V1V1_REGULATOR_ISLAND"
        connectsTo=".MCU > net.V1V1"
        layer="top"
        unbroken={compactCoreIsland}
        clearance="0.18mm"
        boardEdgeMargin={0}
        outline={(compactCoreIsland
          ? [
              { x: 1.2, y: 23.8 },
              { x: 3.3, y: 23.8 },
              { x: 3.3, y: 25.8 },
              { x: 1.2, y: 25.8 },
            ]
          : [
              { x: -0.2, y: 23.8 },
              { x: 2.9, y: 23.8 },
              { x: 2.9, y: 25.8 },
              { x: -0.2, y: 25.8 },
            ]
        ).map(({ x, y }) => ({
          x:
            x * Math.cos((coreIslandRotation * Math.PI) / 180) -
            (y - 17) * Math.sin((coreIslandRotation * Math.PI) / 180) +
            coreIslandOffsetX,
          y:
            17 +
            x * Math.sin((coreIslandRotation * Math.PI) / 180) +
            (y - 17) * Math.cos((coreIslandRotation * Math.PI) / 180) +
            coreIslandOffsetY,
        }))}
      />
    )}

    <silkscreentext
      text="LCDWIKI 2.8 SPI"
      fontSize="1.2mm"
      pcbX={0}
      pcbY={27}
    />
    <silkscreentext
      text="BAT"
      fontSize="0.9mm"
      pcbX={-58}
      pcbY={25}
      pcbRotation={90}
    />
    <silkscreentext text="USB-C / VBUS" fontSize="0.9mm" pcbX={0} pcbY={39} />
    <silkscreentext
      text="PWR SW"
      fontSize="0.9mm"
      pcbX={54}
      pcbY={-30}
      pcbRotation={90}
    />
    <silkscreentext text="UP" fontSize="0.9mm" pcbX={-64} pcbY={-7} />
    <silkscreentext text="DOWN" fontSize="0.9mm" pcbX={-64} pcbY={7} />
    <silkscreentext text="LEFT" fontSize="0.9mm" pcbX={-52} pcbY={7} />
    <silkscreentext text="RIGHT" fontSize="0.9mm" pcbX={-52} pcbY={-8} />
    <silkscreentext text="A" fontSize="0.9mm" pcbX={64} pcbY={-7} />
    <silkscreentext text="B" fontSize="0.9mm" pcbX={64} pcbY={7} />
    <silkscreentext text="X" fontSize="0.9mm" pcbX={52} pcbY={-7} />
    <silkscreentext text="Y" fontSize="0.9mm" pcbX={52} pcbY={7} />
    <silkscreentext text="SELECT" fontSize="0.9mm" pcbX={-50} pcbY={31} />
    <silkscreentext text="START" fontSize="0.9mm" pcbX={50} pcbY={31} />
    <silkscreentext text="VOLUME" fontSize="0.9mm" pcbX={-55} pcbY={-27} />
    <silkscreentext text="SPK" fontSize="0.9mm" pcbX={-9} pcbY={-8} />
  </board>
)
