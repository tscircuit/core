import mechanical from "./mechanical-layout.json"
import { DisplayRouting } from "./display-routing"
import { CoreDistribution } from "./core-distribution"
import { GroundReturns } from "./ground-returns"
import { ReferenceLabel } from "./reference-label"
import { supplierPartsEngine } from "./supplier-stock"
import { Fragment, type ComponentType, type ReactNode } from "react"
import type { CapacitorProps, ResistorProps, TraceProps } from "@tscircuit/props"
import { CL05B104KO5NNNC } from "../imports/CL05B104KO5NNNC"
import { CL10A105KB8NNNC } from "../imports/CL10A105KB8NNNC"
import { CC0603KRX7R9BB104 } from "../imports/CC0603KRX7R9BB104"
import { CL21A106KAYNNNE } from "../imports/CL21A106KAYNNNE"
import { A_0402CG150J500NT } from "../imports/A_0402CG150J500NT"
import { UMK212BBJ475KG_T } from "../imports/UMK212BBJ475KG_T"
import { CL31A106KBHNNNE } from "../imports/CL31A106KBHNNNE"
import { A_0603WAF5101T5E } from "../imports/A_0603WAF5101T5E"
import { A_0603WAF270JT5E } from "../imports/A_0603WAF270JT5E"
import { A_0402WGF1001TCE } from "../imports/A_0402WGF1001TCE"
import { A_0603WAF1002T5E } from "../imports/A_0603WAF1002T5E"
import { A_0603WAF1004T5E } from "../imports/A_0603WAF1004T5E"
import { TYPE_C_31_M_12 } from "../imports/TYPE_C_31_M_12"
import { FBF05FT_R470_00L } from "../imports/FBF05FT_R470_00L"
import { RP2354B } from "../imports/RP2354B"
import { TLV62569DBVR } from "../imports/TLV62569DBVR"
import { MWSA0402S_2R2MT } from "../imports/MWSA0402S_2R2MT"
import { CL21A226MAQNNNE } from "../imports/CL21A226MAQNNNE"
import { A_0603WAF8201T5E } from "../imports/A_0603WAF8201T5E"
import { AP2112K_3_3TRG1 } from "../imports/AP2112K_3_3TRG1"
import { ABM8_272_T3 } from "../imports/ABM8_272_T3"
import { AFC01_S24FCA_00 } from "../imports/AFC01_S24FCA_00"
import { USBLC6_2SC6 } from "../imports/USBLC6_2SC6"
import { SI1308EDL_T1_GE3 } from "../imports/SI1308EDL_T1_GE3"
import { A_1206L050_33NR } from "../imports/A_1206L050_33NR"
import { TS_1088_AR02016 } from "../imports/TS_1088_AR02016"
import { MBR0530T1G } from "../imports/MBR0530T1G"
import { FHD252012S_100MT } from "../imports/FHD252012S_100MT"


const capacitorParts: Record<string, ComponentType<Omit<CapacitorProps, "capacitance">>> = {
  C1525: CL05B104KO5NNNC,
  C15849: CL10A105KB8NNNC,
  C14663: CC0603KRX7R9BB104,
  C15850: CL21A106KAYNNNE,
  C1548: A_0402CG150J500NT,
  C412634: UMK212BBJ475KG_T,
  C13585: CL31A106KBHNNNE,
  C45783: CL21A226MAQNNNE,
}
const resistorParts: Record<string, ComponentType<Omit<ResistorProps, "resistance">>> = {
  C23186: A_0603WAF5101T5E,
  C25190: A_0603WAF270JT5E,
  C11702: A_0402WGF1001TCE,
  C25804: A_0603WAF1002T5E,
  C22935: A_0603WAF1004T5E,
  C382278: FBF05FT_R470_00L,
  C25981: A_0603WAF8201T5E,
}

// Physical pin numbers are intentional: they make the datasheet audit explicit.
// Panel: GDEY075T7, UC8179, 800x480, 24-contact / 0.5-mm FPC.
// Manufacturer datasheet: docs/reference/README.md, pin table and circuit (p. 40).
const sheetOf = (section: string) => ["Flash","Control"].includes(section) ? "SHEET_SERVICE" : section === "CorePower" ? "SHEET_CORE" : ["USB", "Power"].includes(section) ? "SHEET_POWER" : ["Panel", "PanelPower", "Boost", "PanelCaps"].includes(section) ? "SHEET_DISPLAY" : "SHEET_MCU"
const net = (name: string) => `net.${name}`

type CapRow = readonly [string, string, string, string, string, number, number, number, string, number, number]
type ResRow = readonly [string, string, string, string, string, string, number, number, number, string, number, number]
type HvCapRow = readonly [string, string, string, string, string, string, number, number, string, number, number]

const caps: readonly CapRow[] = [
  // name, value, package, LCSC, rail, pcbX, pcbY, rotation, section, schX, schY
  ["C1", "1uF", "0603", "C15849", "VBUS", -42, 9, 90, "USB", -4, 3.5],
  ["C2", "100nF", "0603", "C14663", "VBUS", -39, 7, 90, "USB", -2.6, 3.5],
  ["C3", "1uF", "0603", "C15849", "VSYS", -34, 15, 90, "Power", 2, -5.5],
  ["C4", "10uF", "0805", "C15850", "V3V3", -27, 15, 90, "Power", 7, -5.5],
  ["C5", "1uF", "0603", "C15849", "VSYS", 44.5, -2.5, 180, "PanelPower", -11, -6],
  ["C6", "10uF", "0805", "C15850", "EPD_3V3", 44.5, 4.2, 0, "PanelPower", -7, -6],
  ["C7", "100nF", "0402", "C1525", "V3V3", -17.5, -7.6, 270, "Decoupling", 3.5, -1.5],
  ["C8", "100nF", "0402", "C1525", "V3V3", -11.6, -7, 270, "Decoupling", 4.9, -1.5],
  ["C9", "100nF", "0402", "C1525", "V3V3", -6.8, -3.6, 0, "Decoupling", 6.3, -1.5],
  ["C10", "100nF", "0402", "C1525", "V3V3", -6.8, -1.6, 0, "Decoupling", 7.699999999999999, -1.5],
  ["C11", "100nF", "0402", "C1525", "V3V3", -10.2, 7, 90, "Decoupling", 9.1, -1.5],
  ["C12", "100nF", "0402", "C1525", "V3V3", -12.6, 7, 90, "Decoupling", 10.5, -1.5],
  ["C13", "100nF", "0402", "C1525", "V3V3", -19.4, 7, 90, "Decoupling", 3.5, -3.0],
  ["C14", "100nF", "0402", "C1525", "V3V3", -17.4, 9, 90, "Decoupling", 4.9, -3.0],
  ["C15", "1uF", "0603", "C15849", "V3V3", -21, 0.7, 180, "Decoupling", 6.3, -3.0],
  ["C16", "1uF", "0603", "C15849", "VCORE", -14.2, -7, 270, "Decoupling", 3.5, -5],
  ["C17", "100nF", "0402", "C1525", "VCORE", -6.8, 1.6, 0, "Decoupling", 4.9, -5],
  ["C18", "100nF", "0402", "C1525", "VCORE", -15, 7, 90, "Decoupling", 6.3, -5],
  ["C19", "100nF", "0402", "C1525", "V3V3", -20.5, -0.55, 180, "Decoupling", 7.699999999999999, -3.0],
  ["C20", "15pF", "0402", "C1548", "XIN", 0.1, -1.100074, 0, "Clock", 3.5, 2.8],
  ["C21", "15pF", "0402", "C1548", "XOSC_OUT", -3.850011, 3.4, 90, "Clock", 7, 2.8],
  ["C32", "100nF", "0402", "C1525", "V3V3", -21, -3.5, 180, "Decoupling", 9.1, -3.0],
  ["C33", "10uF", "0805", "C15850", "V3V3", -22, 4.5, 180, "Decoupling", 10.5, -3.0],
  ["C34", "10uF", "0805", "C15850", "VSYS", -34.3, -7, 270, "CorePower", -6, 2],
  ["C35", "22uF", "0805", "C45783", "VCORE", -20.5, -8, 0, "CorePower", 2, 2],
  ["C36", "22uF", "0805", "C45783", "VCORE", -20.5, -11, 0, "CorePower", 3.4, 2],
  // Display high-voltage rail capacitors; selected parts are all rated 50 V.
  ["C22", "1uF", "0603", "C15849", "EPD_VSHR", 43.2, 17.3, 180, "PanelCaps", 1, -5],
  ["C23", "1uF", "0603", "C15849", "EPD_3V3", 39.1, 18, 180, "PanelPower", -5.6, -6],
  ["C24", "1uF", "0603", "C15849", "EPD_VDD", 35.7, 18, 180, "PanelCaps", 3, -5],
  ["C25", "1uF", "0603", "C15849", "EPD_VCOM", 32.3, 18, 180, "PanelCaps", 5, -5],
] as const

const resistors: readonly ResRow[] = [
  ["R1", "5.1k", "0603", "C23186", "CC1", "GND", -42, -7, 90, "USB", -4, -0.5],
  ["R2", "5.1k", "0603", "C23186", "CC2", "GND", -39.5, -7, 90, "USB", -2, -0.5],
  ["R3", "27", "0603", "C25190", "USB_DM", "USB_DM_MCU", -25, 1.8, 0, "USB", 3, 2],
  ["R4", "27", "0603", "C25190", "USB_DP", "USB_DP_MCU", -25, -0.3, 0, "USB", 3, 0.1],
  ["R5", "1k", "0402", "C11702", "QSPI_SS", "BOOT_N", -25, -12.8, 180, "Flash", -5.5, 2],
  ["R6", "10k", "0603", "C25804", "V3V3", "QSPI_SS", -21, -15, 180, "Flash", -5.0, 4.2],
  ["R7", "1k", "0402", "C11702", "XOUT", "XOSC_OUT", -5.7, 0.5, 0, "Clock", 8, 5],
  ["R8", "10k", "0603", "C25804", "V3V3", "RUN", -6, -11, 0, "Control", -9, -4],
  ["R9", "10k", "0603", "C25804", "EPD_EN", "GND", 41.5, -2.5, 0, "PanelPower", -11, -3.5],
  ["R10", "1M", "0603", "C22935", "EPD_GDR", "GND", 45.9, 9.3, 90, "Boost", -6, 2],
  ["R11", "0.47", "0805", "C382278", "EPD_RESE", "GND", 45.9, 14.3, 90, "Boost", -3, 2],
  ["R12", "10k", "0603", "C25804", "EPD_3V3", "EPD_CS", 47.7, 12.3, 90, "Panel", 3, 3],
  ["R13", "10k", "0603", "C25804", "EPD_3V3", "EPD_RST", 47.7, 16.3, 90, "Panel", 5, 3],
  ["R14", "27", "0603", "C25190", "SCK_MCU", "EPD_SCK", -15, -10, 270, "Panel", 4.5, -1.2],
  ["R15", "27", "0603", "C25190", "MOSI_MCU", "EPD_MOSI", -11, -10, 270, "Panel", 12, -1.2],
  ["R16", "8.2k", "0603", "C25981", "VCORE", "CORE_FB", -30, -12, 180, "CorePower", 1, -1],
  ["R17", "10k", "0603", "C25804", "CORE_FB", "GND", -33, -12, 0, "CorePower", 1, -3],
] as const

const highVoltageCaps: readonly HvCapRow[] = [
  ["C26", "4.7uF", "C412634", "0805", "EPD_3V3", "GND", 41.9, 6.3, "PanelPower", -4.2, -6],
  ["C27", "4.7uF", "C412634", "0805", "EPD_SW", "EPD_PUMP", 38.1, 10.8, "Boost", -4, 5.5],
  ["C28", "10uF", "C13585", "1206", "EPD_VGH", "GND", 31.7, 14.3, "PanelCaps", 1, -7],
  ["C29", "10uF", "C13585", "1206", "EPD_VSH", "GND", 25.9, 14.3, "PanelCaps", 3, -7],
  ["C30", "10uF", "C13585", "1206", "EPD_VSL", "GND", 26.9, 9.3, "PanelCaps", 5, -7],
  ["C31", "10uF", "C13585", "1206", "EPD_VGL", "GND", 19.9, 9.3, "PanelCaps", 7, -7],
] as const

// RP2354B QFN-80 physical pins; QSPI data/clock stay internal to the package.
const mcuEndpointConnections = {
  pin5: ".C7 > .pin1", pin15: ".C8 > .pin1", pin24: ".C9 > .pin1",
  pin29: ".C10 > .pin1", pin41: ".C11 > .pin1", pin50: ".C12 > .pin1",
  pin60: ".C13 > .pin1", pin59: ".C14 > .pin1", pin68: ".C15 > .pin1",
  pin69: ".C19 > .pin1", pin76: ".C32 > .pin1",
  pin61: ".C33 > .pin1", pin64: ".C33 > .pin1",
  pin10: ".C16 > .pin1", pin32: ".C17 > .pin1", pin51: ".C18 > .pin1",
  pin66: ".R3 > .pin2", pin67: ".R4 > .pin2",
  pin30: ".Y1 > .pin1", pin31: ".R7 > .pin1", pin75: ".R5 > .pin1",
  pin33: ".TP5 > .pin1", pin34: ".TP4 > .pin1", pin35: ".SW2 > .pin1",
  pin6: ".DC_FROM_VIA > .top", pin7: ".CS_FROM_VIA > .top",
  pin8: ".R14 > .pin1", pin9: ".R15 > .pin1",
  pin11: ".RST_FROM_VIA > .top", pin12: ".BUSY_FROM_VIA > .top", pin13: ".EN_FROM_VIA > .top",
} as const

const panelEndpointConnections = {pin2: net("EPD_GDR"), pin3: net("EPD_RESE"), pin5: net("EPD_VSHR"),
          pin8: net("GND"), pin9: net("EPD_BUSY"), pin10: net("EPD_RST"), pin11: net("EPD_DC"),
          pin12: net("EPD_CS"), pin13: net("EPD_SCK"), pin14: net("EPD_MOSI"),
          pin15: net("EPD_3V3"), pin16: net("EPD_3V3"), pin17: net("GND"), pin18: net("EPD_VDD"),
          pin20: net("EPD_VSH"), pin21: net("EPD_VGH"), pin22: net("EPD_VSL"),
          pin23: net("EPD_VGL"), pin24: net("EPD_VCOM"), pin25: net("GND"), pin26: net("GND")
} as const

// Authored pad-to-bypass fanouts; board-space points, independent of router output.
const mcuLocalWaypoints: Record<string, readonly (readonly [number, number])[]> = {
  pin6: [[-15.8,-4]], pin7: [[-15.4,-4.1],[-15,-3.7]],
  pin11: [[-13.8,-4]], pin12: [[-13.4,-4.05],[-13.1,-3.75],[-13.1,-3]],
  pin13: [[-13,-4.25],[-12.25,-3.5]],
  pin24: [[-8.22,-2.6]], pin29: [[-8.22,-.6]],
  pin32: [[-7.62,.6]],
  pin68: [[-19.5,1]], pin69: [[-19.5,.6],[-20.08,.020002]],
  pin76: [[-19.88,-2.2],[-20.58,-2.9]],
  pin61: [[-20.300094,3.8]], pin64: [[-19.7,2.599944],[-20.2,3.099944],[-20.2,3.7]],
  pin30: [[-5.9,-.2],[-5.7,0],[-3.250011,0]],
  pin31: [[-6.420116,.2]],
  pin5: [[-16.2,-5.879884]], pin15: [[-12.2,-5.979884]],
  pin10: [[-14.2,-5.5]], pin41: [[-10.2,5.8]],
  pin50: [[-13.8,5.379884]], pin51: [[-14.2,5.779884]],
  pin60: [[-18.42635,5.607534]], pin59: [[-17.4,7.5]],
}
const inMcuFrame = (points: readonly (readonly [number,number])[]) => points.map(([x,y]) => ({x:y,y:-(x+14)}))
const coreSupplyPins = new Set(["pin10", "pin32", "pin51"])
const ioSupplyPins = new Set(["pin5","pin15","pin24","pin29","pin41","pin50","pin59","pin60","pin61","pin64","pin68","pin69","pin76"])
const groundDrops = [
  {name:"C7_GND",from:".C7 > .pin2",x:-17.5,y:-9},
  {name:"C8_GND",from:".C8 > .pin2",x:-11.6,y:-8.4},
  {name:"C9_GND",from:".C9 > .pin2",x:-5.4,y:-3.6},
  {name:"C10_GND",from:".C10 > .pin2",x:-5.4,y:-1.6},
  {name:"C11_GND",from:".C11 > .pin2",x:-10.2,y:8.4},
  {name:"C12_GND",from:".C12 > .pin2",x:-12.6,y:8.4},
  {name:"C13_GND",from:".C13 > .pin2",x:-19.4,y:8.4},
  {name:"C14_GND",from:".C14 > .pin2",x:-17.4,y:10.4},
  {name:"C15_GND",from:".C15 > .pin2",x:-23,y:.7},
  {name:"C16_GND",from:".C16 > .pin2",x:-14.2,y:-8.6},
  {name:"C17_GND",from:".C17 > .pin2",x:-5.4,y:1.6},
  {name:"C18_GND",from:".C18 > .pin2",x:-15,y:8.4},
  {name:"C19_GND",from:".C19 > .pin2",x:-21.9,y:-.55},
  {name:"C20_GND",from:".C20 > .pin2",x:1.5,y:-1.100074},
  {name:"C21_GND",from:".C21 > .pin2",x:-3.850011,y:4.8},
  {name:"C32_GND",from:".C32 > .pin2",x:-22.4,y:-3.5},
  {name:"C33_GND",from:".C33 > .pin2",x:-24.4,y:4.5},
  {name:"C34_GND",from:".C34 > .pin2",x:-34.3,y:-9.4},
  {name:"C35_GND",from:".C35 > .pin2",x:-18.1,y:-8},
  {name:"C36_GND",from:".C36 > .pin2",x:-18.1,y:-11},
  {name:"Y1_CASE_2",from:".Y1 > .pin2",x:-1,y:2},
  {name:"Y1_CASE_4",from:".Y1 > .pin4",x:-4.6,y:-2.2},
  {name:"CORE_REG_GND",from:".U5 > .pin2",x:-30.7,y:-8},
  {name:"CORE_FB_GND",from:".R17 > .pin2",x:-33,y:-13.6},
  {name:"MCU_PGND",from:".U1 > .pin62",x:-17.5,y:3.400044},
  {name:"MCU_FB_GND",from:".U1 > .pin65",x:-17.5,y:2.199894},
]
const localGroundCapNames = new Set(groundDrops.filter(d => d.name.startsWith("C")).map(d => d.name.split("_")[0]))

export function ControllerBoard({children}: {children?: ReactNode} = {}) {
  return (
    <board name="CONTROLLER" width="100mm" height="60mm" thickness="1.6mm" layers={4} outline={mechanical.board_outline_mm.map(([x,y]) => ({x,y}))}
      partsEngine={supplierPartsEngine} schTraceAutoLabelEnabled
      title="USB-C E-PAPER / RP2354B / GDEY075T7"
      fabricatorPreset="jlcpcb_standard" solderMaskColor="black" silkscreenColor="white"
      minTraceWidth="0.15mm" minTraceToPadEdgeClearance="0.15mm"
      minPadEdgeToPadEdgeClearance="0.15mm" minBoardEdgeClearance="0.3mm"
      minViaEdgeToPadEdgeClearance="0.15mm" minTraceToHoleEdgeClearance="0.35mm" minViaHoleEdgeToViaHoleEdgeClearance="0.4mm"
      minViaHoleDiameter="0.3mm" minViaPadDiameter="0.55mm"
      pcbStyle={{viaHoleDiameter: 0.3, viaPadDiameter: 0.55, silkscreenFontSize: 1}}
      defaultViaTenting="both_sides" allowBlindAndBuriedVias={false}
      autorouterVersion="beta_pipeline9" autorouterEffortLevel="1x" routeRemaining={false}
      autorouter={{local: true, preset: "tscircuit", serverCacheEnabled: false}}>
      <autoroutingphase name="MAIN_ROUTE" phaseIndex={1} autorouter="tscircuit" />
      <schematicsheet name="SHEET_POWER" displayName="USB-C and main power" sheetIndex={1} />
      <schematicsheet name="SHEET_MCU" displayName="RP2354B, core supply, clock and debug" sheetIndex={2} />
      <schematicsheet name="SHEET_SERVICE" displayName="BOOTSEL, reset and SWD service" sheetIndex={5} />
      <schematicsheet name="SHEET_CORE" displayName="RP2354B external core supply" sheetIndex={4} />
      <schematicsheet name="SHEET_DISPLAY" displayName="7.5-inch raw panel and boost supply" sheetIndex={3} />
      {[
        ["USB", "USB-C / 5 V input"], ["Power", "3.3 V MCU supply"],
        ["MCU", "RP2354B"], ["Decoupling", "Local MCU bypass capacitors"],
        ["Flash", "Internal flash / BOOTSEL"], ["CorePower", "External 1.092 V core supply"], ["Clock", "12 MHz reference"],
        ["Control", "Reset and debug"], ["Panel", "Raw 7.5-inch panel interface"],
        ["PanelPower", "Switched panel supply"], ["Boost", "Panel boost / charge pump"],
        ["PanelCaps", "50 V display rail reservoirs"],
      ].map(([name, displayName]) => <Fragment key={name}><schematicsection name={name} displayName={displayName} /></Fragment>)}

      <net name="GND" isGroundNet />
      <net routingPhaseIndex={1} name="VBUS" isPowerNet nominalTraceWidth="0.4mm" />
      <net routingPhaseIndex={1} name="VSYS" isPowerNet nominalTraceWidth="0.4mm" />
      <net routingPhaseIndex={1} name="V3V3" isPowerNet nominalTraceWidth="0.25mm" />
      <net routingPhaseIndex={1} name="VCORE" isPowerNet nominalTraceWidth="0.2mm" />
      <net routingPhaseIndex={1} name="EPD_3V3" isPowerNet nominalTraceWidth="0.4mm" />
      {["EPD_SW", "EPD_PUMP", "EPD_VGH", "EPD_VGL", "EPD_VSH", "EPD_VSL", "EPD_VCOM", "EPD_VSHR"].map(name =>
        <Fragment key={name}><net routingPhaseIndex={1} name={name} nominalTraceWidth="0.2mm" minTraceClearance="0.12mm" /></Fragment>)}
      {["CC1", "CC2", "USB_DP", "USB_DM", "EPD_EN", "USB_DM_MCU", "USB_DP_MCU",
        "XIN", "XOUT", "QSPI_SS", "CORE_SW", "CORE_FB",
        "SWCLK", "SWDIO", "RUN", "EPD_DC", "EPD_CS", "SCK_MCU", "MOSI_MCU", "EPD_RST", "EPD_BUSY",
        "XOSC_OUT", "BOOT_N", "EPD_GDR", "EPD_RESE", "EPD_SCK", "EPD_MOSI", "EPD_VDD"].map(name =>
        <Fragment key={name}><net routingPhaseIndex={1} name={name} /></Fragment>)}

      {/* Source-authored USB power entry. Clear the grounded shell tabs with
          a horizontal pad escape and 45-degree bend, then run straight to the local VBUS capacitor.
          Native routing treats this declared path as fixed copper. */}
      <trace routingPhaseIndex={1} name="VBUS_ENTRY" from=".J1 > .VBUS2" to=".C1 > .pin1"
        thickness="0.4mm" pcbPathRelativeTo=".J1 > .VBUS2"
        pcbPath={[{x:-2.3999571,y:3.25}, {x:-3.1499571,y:4}]} />

      {/* External core supply: RP2350 datasheet Figure 24. VREG_FB and
          VREG_PGND are grounded; VREG_LX is open; AVDD/VIN remain at 3.3 V. */}
      <trace name="CORE_INPUT_LOCAL" routingPhaseIndex={1} from=".U5 > .pin4" to=".C34 > .pin1"
        thickness="0.4mm" pcbPathRelativeTo=".U5 > .pin4" pcbPath={[{x:-2.350137,y:1.999998}]} />
      <trace name="CORE_SWITCH_LOCAL" routingPhaseIndex={1} from=".U5 > .pin3" to=".L2 > .pin1"
        thickness="0.4mm" pcbPathRelativeTo=".U5 > .pin3" pcbPath={[{x:2.222104,y:0.94996}]} />
      <trace name="CORE_OUTPUT_LOCAL" routingPhaseIndex={1} from=".L2 > .pin2" to=".C35 > .pin1"
        thickness="0.4mm" pcbPathRelativeTo=".C35 > .pin1" pcbPath={[{x:-2.3,y:0}]} />
      <trace name="CORE_RESERVOIR_LOCAL" routingPhaseIndex={1} from=".C35 > .pin1" to=".C36 > .pin1"
        thickness="0.4mm" pcbPathRelativeTo=".C35 > .pin1" pcbPath={[{x:-.999998,y:-1.5}]} />
      {groundDrops.map(drop => <Fragment key={drop.name}>
        <via name={`${drop.name}_VIA`} pcbX={drop.x} pcbY={drop.y}
          fromLayer="top" toLayer="bottom" holeDiameter="0.3mm" outerDiameter="0.55mm"
          connectsTo="net.GND" tented="both_sides" />
        <trace routingPhaseIndex={1} name={`${drop.name}_RETURN`} from={drop.from} to={`.${drop.name}_VIA > .top`}
          thickness="0.15mm" maxLength="2mm" pcbPathRelativeTo={`.${drop.name}_VIA > .top`} pcbPath={[{x:0,y:0}]} />
      </Fragment>)}
      <via name="MCU_GND_VIA" pcbX={-11.7} pcbY={0} fromLayer="top" toLayer="bottom"
        holeDiameter="0.3mm" outerDiameter="0.55mm" connectsTo="net.GND" tented="both_sides" />
      <trace routingPhaseIndex={1} name="MCU_EXPOSED_GND" from=".U1 > .pin81" to=".MCU_GND_VIA > .top"
        thickness="0.25mm" maxLength="3mm" pcbPath={[{x:0,y:-1.8}]} />
      <trace routingPhaseIndex={1} name="CRYSTAL_DRIVE" from=".R7 > .pin2" to=".Y1 > .pin3" thickness="0.15mm" maxLength="6mm" pcbPath={[{x:1.03345,y:.600074}]} />
      <trace routingPhaseIndex={1} name="CRYSTAL_LOAD_IN" from=".C20 > .pin1" to=".Y1 > .pin1" thickness="0.15mm" maxLength="3mm" pcbPath={[{x:-.420116,y:0}]} />
      <trace routingPhaseIndex={1} name="CRYSTAL_LOAD_OUT" from=".C21 > .pin1" to=".Y1 > .pin3" thickness="0.15mm" maxLength="3mm" pcbPath={[{x:-1.4,y:0}]} />

      <DisplayRouting />
      <CoreDistribution />
      <GroundReturns />
      <trace routingPhaseIndex={1} name="RUN_PULLUP" from=".R8 > .pin2" to=".TP6 > .pin1" thickness="0.15mm"
        pcbPathRelativeTo=".R8 > .pin2" pcbPath={[{x:1.246636,y:-1.246636}]} />
      <trace routingPhaseIndex={1} name="RUN_SERVICE_LINK" from=".TP6 > .pin1" to=".SW2 > .pin1" thickness="0.15mm"
        pcbPathRelativeTo=".TP6 > .pin1" pcbPath={[{x:-3,y:-3},{x:-6.184908,y:-3}]} />

      <bus name="VBUS_WIDTH" connections={["C2.pin1"]} pcbTraceWidth="0.4mm" />
      <bus name="LOGIC_POWER_WIDTH" connections={["C4.pin1"]} pcbTraceWidth="0.25mm" />
      <bus name="CORE_POWER_WIDTH" connections={["CORE_OUTPUT_LOCAL"]} pcbTraceWidth="0.2mm" />

      <TYPE_C_31_M_12 name="J1" standard="usb_c" allowOffBoard schWidth={1.771}
        pcbX={-46} pcbY={0} pcbRotation={270} schX={-7} schY={2} schSectionName="USB" schSheetName={sheetOf("USB")}
        connections={{VBUS1: net("VBUS"), VBUS2: net("VBUS"), GND1: net("GND"), GND2: net("GND"),
          SHELL1: net("GND"), SHELL2: net("GND"), SHELL3: net("GND"), SHELL4: net("GND"),
          CC1: net("CC1"), CC2: net("CC2"), DP1: net("USB_DP"), DP2: net("USB_DP"),
          DM1: net("USB_DM"), DM2: net("USB_DM")}} />
      <A_1206L050_33NR name="F1"
        pcbX={-39} pcbY={13} schX={-3} schY={6} schSectionName="USB" schSheetName={sheetOf("USB")}
        connections={{pin1: net("VBUS"), pin2: net("VSYS")}} />
      <USBLC6_2SC6 name="U2" pcbX={-39} pcbY={0} pcbRotation={90}
        schX={0} schY={1} schSectionName="USB" schSheetName={sheetOf("USB")}
        connections={{pin1: net("USB_DP"), pin6: net("USB_DP"), pin3: net("USB_DM"), pin4: net("USB_DM"),
          pin2: net("GND"), pin5: net("VBUS")}} />

      <AP2112K_3_3TRG1 name="U3" pcbX={-31} pcbY={15} pcbRotation={90}
        schX={5} schY={-3} schSectionName="Power" schSheetName={sheetOf("Power")}
        connections={{pin1: net("VSYS"), pin2: net("GND"), pin3: net("VSYS"), pin5: net("V3V3")}} />
      <AP2112K_3_3TRG1 name="U4" pcbX={46.5} pcbY={0.5} pcbRotation={180}
        schX={-8} schY={-3.5} schSectionName="PanelPower" schSheetName={sheetOf("PanelPower")}
        connections={{pin1: net("VSYS"), pin2: net("GND"), pin3: net("EPD_EN"), pin5: net("EPD_3V3")}} />

      <group name="MCU_ESCAPE" pcbX={-14} pcbY={0} padding={2}
        minTraceToPadEdgeClearance="0.15mm" minViaEdgeToPadEdgeClearance="0.15mm"
        minTraceToHoleEdgeClearance="0.35mm" minViaHoleEdgeToViaHoleEdgeClearance="0.4mm">
      <RP2354B name="U1" pcbX={0} pcbY={0} pcbRotation={90}
        schX={-9} schY={0} schSectionName="MCU" schSheetName={sheetOf("MCU")} schWidth={2.8} schHeight={8.4}
         />
      </group>
      {Object.entries(mcuEndpointConnections).map(([pin,target]) =>
        <Fragment key={`U1-${pin}`}><trace routingPhaseIndex={1} name={`MCU_${pin}`} from={`.U1 > .${pin}`} to={target}
          thickness={ioSupplyPins.has(pin) ? "0.25mm" : coreSupplyPins.has(pin) ? "0.2mm" : "0.15mm"}
          pcbPath={mcuLocalWaypoints[pin] ? inMcuFrame(mcuLocalWaypoints[pin]) : undefined} /></Fragment>)}
      <TLV62569DBVR name="U5" pcbX={-31} pcbY={-8} schX={-3} schY={2}
        schSectionName="CorePower" schSheetName="SHEET_CORE"
        connections={{pin1:net("V3V3"),pin2:net("GND"),pin3:net("CORE_SW"),pin4:net("VSYS"),pin5:net("CORE_FB")}} />
      <MWSA0402S_2R2MT name="L2" pcbX={-25.8} pcbY={-8} pcbRotation={180} schX={0} schY={2}
        schSectionName="CorePower" schSheetName="SHEET_CORE" connections={{pin1:net("CORE_SW"),pin2:net("VCORE")}} />
      <ABM8_272_T3 name="Y1" pcbX={-3} pcbY={0} pcbRotation={90} loadCapacitance="10pF"
        schX={5} schY={5} schSectionName="Clock" schSheetName={sheetOf("Clock")}
        connections={{pin1: net("XIN"), pin3: net("XOSC_OUT")}} />
      <TS_1088_AR02016 name="SW1" schRotation={-90} pcbX={-28} pcbY={-19} schX={-8} schY={1} schSectionName="Flash" schSheetName={sheetOf("Flash")}
        connections={{pin1: net("BOOT_N"), pin2: net("GND")}} />
      <TS_1088_AR02016 name="SW2" schRotation={-90} pcbX={-8} pcbY={-19} schX={-6} schY={-4} schSectionName="Control" schSheetName={sheetOf("Control")}
        connections={{pin1: net("RUN"), pin2: net("GND")}} />

      <group name="PANEL_ESCAPE" pcbX={38.9} pcbY={22.3} padding={1.2}
>
      <AFC01_S24FCA_00 name="J2" pcbX={0} pcbY={0} pcbRotation={180}
        schX={8} schY={0} schSectionName="Panel" schSheetName={sheetOf("Panel")} schWidth={2.2} schHeight={2.8}
         />
      </group>
      {Object.entries(panelEndpointConnections).map(([pin,target]) =>
        <Fragment key={`J2-${pin}`}><trace routingPhaseIndex={1} name={`PANEL_${pin}`} from={`.J2 > .${pin}`} to={target} /></Fragment>)}
      <SI1308EDL_T1_GE3 name="Q1" pcbX={41.9} pcbY={13.3} pcbRotation={270} schX={-4} schY={3} schSectionName="Boost" schSheetName={sheetOf("Boost")}
        connections={{pin1: net("EPD_GDR"), pin2: net("EPD_RESE"), pin3: net("EPD_SW")}} />
      <FHD252012S_100MT name="L1" pcbX={41.9} pcbY={9.3} schX={-7} schY={5.5} schSectionName="Boost" schSheetName={sheetOf("Boost")} pcbRotation={90}
        connections={{pin1: net("EPD_3V3"), pin2: net("EPD_SW")}} />
      <MBR0530T1G name="D1" schRotation={-90} pcbX={31.9} pcbY={8.3} schX={-3} schY={7} schSectionName="Boost" schSheetName={sheetOf("Boost")} pcbRotation={90}
        connections={{pin1: net("EPD_PUMP"), pin2: net("EPD_VGL")}} />
      <MBR0530T1G name="D2" schRotation={-90} pcbX={34.9} pcbY={8.3} schX={-6} schY={7} schSectionName="Boost" schSheetName={sheetOf("Boost")} pcbRotation={90}
        connections={{pin1: net("GND"), pin2: net("EPD_PUMP")}} />
      <MBR0530T1G name="D3" schRotation={90} pcbRotation={270} pcbX={36.9} pcbY={14.3} schX={-0.5} schY={5.5} schSectionName="Boost" schSheetName={sheetOf("Boost")}
        connections={{pin1: net("EPD_VGH"), pin2: net("EPD_SW")}} />

      {caps.map(([name, capacitance, footprint, sku, rail, pcbX, pcbY, pcbRotation, schSectionName, schX, schY]) => {
        const Part = capacitorParts[sku]
        return <Part key={name} name={name} pcbX={pcbX} pcbY={pcbY} pcbRotation={pcbRotation}
          maxDecouplingTraceLength={name === "C19" ? "2mm" : ["C15", "C16"].includes(name) ? "6mm" : Number(name.slice(1)) >= 7 && Number(name.slice(1)) <= 18 ? "4mm" : undefined}
          schX={schX} schY={schY} schSectionName={schSectionName} schSheetName={sheetOf(schSectionName)} schOrientation="vertical"
          connections={localGroundCapNames.has(name) ? {pin1: net(rail)} : {pin1: net(rail), pin2: net("GND")}} />
      })}
      {resistors.map(([name, resistance, footprint, sku, a, b, pcbX, pcbY, pcbRotation, schSectionName, schX, schY]) => {
        const Part = resistorParts[sku]
        return <Part key={name} name={name} pcbX={pcbX} pcbY={pcbY} pcbRotation={pcbRotation}
          schX={schX} schY={schY} schSectionName={schSectionName} schSheetName={sheetOf(schSectionName)}
          schRotation={name === "R15" ? 180 : b === "GND" || a === "V3V3" || a === "VCORE" || a === "EPD_3V3" ? -90 : 0}
          connections={{pin1: net(a), pin2: net(b)}} />
      })}
      {highVoltageCaps.map(([name, capacitance, sku, footprint, a, b, pcbX, pcbY, schSectionName, schX, schY]) => {
        const Part = capacitorParts[sku]
        return <Part key={name} name={name} pcbX={pcbX} pcbY={pcbY} pcbRotation={180}
          schX={schX} schY={schY} schSectionName={schSectionName} schSheetName={sheetOf(schSectionName)} schOrientation={name === "C27" ? "pos_bottom" : "vertical"}
          connections={{pin1: net(a), pin2: net(b)}} />
      })}

      <copperpour name="GND_REFERENCE" layer="inner1" connectsTo="net.GND" clearance={0.3} boardEdgeMargin={0.3} />

      {mechanical.pcb_holes_mm.map(([pcbX,pcbY],i) =>
        <Fragment key={i}><hole name={`H${i+1}`} diameter="3.2mm" pcbX={pcbX} pcbY={pcbY} /></Fragment>)}
      {[[-40,24],[12,24],[-40,-24]].map(([pcbX,pcbY],i) =>
        <Fragment key={i}><fiducial name={`FID${i+1}`} pcbX={pcbX} pcbY={pcbY} padDiameter={1} soldermaskPullback={0.5} /></Fragment>)}
      {["GND","V3V3","VCORE","SWDIO","SWCLK","RUN"].map((rail,i) =>
        <testpoint key={rail} name={`TP${i+1}`} padDiameter={1.5} footprintVariant="pad" doNotPlace
          footprint={<footprint>
            <smtpad shape="circle" radius={0.75} portHints={["pin1"]} noSolderPaste solderMaskMargin={0.02} />
            <ReferenceLabel name={`TP${i+1}`} />
          </footprint>} pcbX={i < 3 ? -17+i*3.5 : i === 5 ? -4 : 0} pcbY={i < 3 ? -24 : [8,4,-14][i-3]}
          schX={i === 5 ? -3.5 : -9+i*2} schY={i === 5 ? -3.33 : -7} schSectionName="Control" schSheetName={sheetOf("Control")} connections={{pin1: net(rail)}} />)}
      <silkscreentext text="USB-C E-PAPER" pcbX={-11} pcbY={23} fontSize={2} />
      <silkscreentext text="RP2354B / 7.5 IN / 800 x 480" pcbX={-8} pcbY={19.5} fontSize={1} />
      <silkscreentext text="REV C / RP2354B" pcbX={20} pcbY={-23} fontSize={1} />
      <silkscreentext text="BOOT" pcbX={-28} pcbY={-15.5} fontSize={1} />
      <silkscreentext text="RESET" pcbX={-8} pcbY={-15.5} fontSize={1} />
      <silkscreentext text="RAW EPD / CONTACTS DOWN" pcbX={24} pcbY={-18} fontSize={1} />
      {children}
    </board>
  )
}
