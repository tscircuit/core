import { Fragment } from "react"
import { RP2040 } from "./imports/RP2040"
import { TYPE_C_16PIN_2MD_073_ } from "./imports/TYPE_C_16PIN_2MD_073_"
import { W25Q16JVUXIQ } from "./imports/W25Q16JVUXIQ"
import { AP2112K_3_3TRG1 } from "./imports/AP2112K_3_3TRG1"
import { X322512MSB4SI } from "./imports/X322512MSB4SI"
import { SKRPACE010 } from "./imports/SKRPACE010"

const leftHeaderPins = [
  "GP0",
  "GP1",
  "GND",
  "GP2",
  "GP3",
  "GP4",
  "GP5",
  "GND",
  "GP6",
  "GP7",
  "GP8",
  "GP9",
  "GND",
  "GP10",
  "GP11",
  "GP12",
  "GP13",
  "GND",
  "GP14",
  "GP15",
]

const rightHeaderPins = [
  "VBUS",
  "VSYS",
  "GND",
  "V3V3_EN",
  "V3V3",
  "ADC_VREF",
  "GP28_ADC2",
  "GND",
  "GP27_ADC1",
  "GP26_ADC0",
  "RUN",
  "GP22",
  "GND",
  "GP21",
  "GP20",
  "GP19",
  "GP18",
  "GND",
  "GP17",
  "GP16",
]

const makeUniquePinLabels = (pins: string[]) =>
  pins.map((pin, index) => (pins.indexOf(pin) === index ? pin : `${pin}_${index + 1}`))

const makePcbPinLabels = (pins: string[]) =>
  Object.fromEntries(pins.map((pin, index) => [`pin${index + 1}`, pin]))

const leftHeaderPortLabels = makeUniquePinLabels(leftHeaderPins)
const rightHeaderPortLabels = makeUniquePinLabels(rightHeaderPins)
const leftHeaderPinLabels = makePcbPinLabels(leftHeaderPortLabels)
const rightHeaderPinLabels = makePcbPinLabels(rightHeaderPortLabels)
const denseTraceProps = { thickness: "0.1mm" } as const
const gndLabel = { displayName: "GND", schDisplayLabel: "GND" } as const
const vbusLabel = { displayName: "VBUS", schDisplayLabel: "VBUS" } as const
const vsysLabel = { displayName: "VSYS", schDisplayLabel: "VSYS" } as const
const v3v3Label = { displayName: "V3V3", schDisplayLabel: "V3V3" } as const
const v1v1Label = { displayName: "V1V1", schDisplayLabel: "V1V1" } as const
const adcRefLabel = { displayName: "ADC_REF", schDisplayLabel: "ADC_REF" } as const
const runLabel = { displayName: "RUN", schDisplayLabel: "RUN" } as const
const schSections = {
  rp2040: "rp2040",
  headers: "headers",
  usb: "usb",
  power: "power",
  flash: "flash",
  clock: "clock",
  controls: "controls",
  display: "display",
  status: "status",
  debug: "debug",
} as const

const rp2040Pins = {
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
  pin57: ["GND"]
}

type PicoSubcircuitProps = {
  pcbX?: string | number
  pcbY?: string | number
  pcbRotation?: string | number
  schX?: string | number
  schY?: string | number
  schRotation?: string | number
}

const UsbCFootprint = () => (
  <footprint>
    <smtpad portHints={["VBUS"]} pcbX="-3.2mm" pcbY="-1.8mm" width="0.6mm" height="1.5mm" shape="rect" />
    <smtpad portHints={["D_NEG"]} pcbX="-1.05mm" pcbY="-1.8mm" width="0.5mm" height="1.5mm" shape="rect" />
    <smtpad portHints={["D_POS"]} pcbX="1.05mm" pcbY="-1.8mm" width="0.5mm" height="1.5mm" shape="rect" />
    <smtpad portHints={["GND"]} pcbX="3.2mm" pcbY="-1.8mm" width="0.6mm" height="1.5mm" shape="rect" />
    <smtpad portHints={["CC1"]} pcbX="-2.1mm" pcbY="-1.8mm" width="0.5mm" height="1.5mm" shape="rect" />
    <smtpad portHints={["CC2"]} pcbX="2.1mm" pcbY="-1.8mm" width="0.5mm" height="1.5mm" shape="rect" />
    <smtpad portHints={["SHIELD1"]} pcbX="-4.6mm" pcbY="0.8mm" width="1.8mm" height="2.4mm" shape="rect" />
    <smtpad portHints={["SHIELD2"]} pcbX="4.6mm" pcbY="0.8mm" width="1.8mm" height="2.4mm" shape="rect" />
  </footprint>
)

const SmallCrystalFootprint = () => (
  <footprint>
    <smtpad portHints={["pin1"]} pcbX="-1.25mm" pcbY="0mm" width="1.1mm" height="1.4mm" shape="rect" />
    <smtpad portHints={["pin2"]} pcbX="1.25mm" pcbY="0mm" width="1.1mm" height="1.4mm" shape="rect" />
  </footprint>
)

const PicoHeaderFootprint = ({ ports }: { ports: string[] }) => (
  <footprint insertionDirection="from_above">
    {ports.map((portName, index) => (
      <Fragment key={portName}>
        <platedhole
          portHints={[portName]}
          pcbX="0mm"
          pcbY={`${(9.5 - index) * 2.54}mm`}
          shape="circle"
          holeDiameter="1mm"
          outerDiameter="1.7mm"
        />
      </Fragment>
    ))}
  </footprint>
)

export const PicoSubcircuit = (props: PicoSubcircuitProps) => (
  <subcircuit name="PICO" {...props}>

    <trace name="Y1_G1" from=".Y1 > .GND1" to="net.GND" {...gndLabel} />
<trace name="Y1_G2" from=".Y1 > .GND2" to="net.GND" {...gndLabel} />

    <trace name="USB_DN_B" from=".J_USB > .B7" to=".R_USB1 > .pin1" />
<trace name="USB_DP_B" from=".J_USB > .B6" to=".R_USB2 > .pin1" />

    <diode
  name="D_VBUS"
  footprint="sod123"
  schSectionName={schSections.power}
  pcbX={-2
  }
      supplierPartNumbers={{ jlcpcb: ["C8598"] }}
  pcbY={21}
  pcbRotation={-90}
/>
    <trace name="VBUS_D" from="net.VBUS" to=".D_VBUS > .anode" {...vbusLabel} />
<trace name="D_VSYS" from=".D_VBUS > .cathode" to="net.VSYS" {...vsysLabel} />

      <resistor name="R_3V3_EN" resistance="100k" footprint="0402" schSectionName={schSections.power} pcbX={-4.7} pcbY={17.3} pcbRotation={90} />

<trace name="EN_VSYS" from=".R_3V3_EN > .pin1" to="net.VSYS" {...vsysLabel} />
<trace name="EN_R" from=".R_3V3_EN > .pin2" to=".U3 > .EN" />
<trace name="EN_HDR" from=".J_RIGHT > .V3V3_EN" to=".U3 > .EN" />


    
    
    <capacitor name="C_IOVDD5" capacitance="100nF" footprint="0402" schSectionName={schSections.rp2040} schOrientation="vertical" pcbRotation={-90} pcbX={-6} pcbY={-10} schX={-9.6} schY={0} />
<capacitor name="C_IOVDD6" capacitance="100nF" footprint="0402" schSectionName={schSections.rp2040} schOrientation="vertical" pcbX={-8} pcbY={1.6} schX={-7.2} schY={2.31} />


    
<trace name="IO5_3V3" from=".C_IOVDD5 > .pin1" to="net.V3V3" {...v3v3Label} />
<trace name="IO5_G" from=".C_IOVDD5 > .pin2" to="net.GND" {...gndLabel} />
<trace name="IO6_3V3" from=".C_IOVDD6 > .pin1" to="net.V3V3" {...v3v3Label} />
<trace name="IO6_G" from=".C_IOVDD6 > .pin2" to="net.GND" {...gndLabel} />

<capacitor name="C_IOVDD3" capacitance="100nF" footprint="0402" schSectionName={schSections.rp2040} schOrientation="vertical" pcbRotation={-90} pcbX={-8} pcbY={-1} schX={-7.2} schY={-2.31} />
<capacitor name="C_IOVDD4" capacitance="100nF" footprint="0402" schSectionName={schSections.rp2040} schOrientation="vertical" pcbX={-2} pcbY={-10} schX={-7.9} schY={0} />

    <trace name="IO3_3V3" from=".C_IOVDD3 > .pin1" to="net.V3V3" {...v3v3Label} />
<trace name="IO3_G" from=".C_IOVDD3 > .pin2" to="net.GND" {...gndLabel} />
<trace name="IO4_3V3" from=".C_IOVDD4 > .pin1" to="net.V3V3" {...v3v3Label} />
<trace name="IO4_G" from=".C_IOVDD4 > .pin2" to="net.GND" {...gndLabel} />
    
    <resistor
  name="R_RUN"
  resistance="10k"
  footprint="0402"
  schSectionName={schSections.controls}
  pcbX={10.4}
  pcbY={-5.5}
/>

<capacitor
  name="C_FLASH"
  capacitance="100nF"
  footprint="0402"
  schSectionName={schSections.flash}
  schOrientation="vertical"
  pcbX={-5.5}
  pcbY={10.8}
  pcbRotation={180}
  schX={16.65}
  schY={-6.92}
/>

<capacitor
  name="C_IOVDD1"
  capacitance="100nF"
  footprint="0402"
  schSectionName={schSections.rp2040}
  schOrientation="vertical"
  pcbX={-3}
  pcbY={-6}
  schX={-10.8}
  schY={-2.31}
/>

<capacitor
  name="C_IOVDD2"
  capacitance="100nF"
  footprint="0402"
  schSectionName={schSections.rp2040}
  schOrientation="vertical"
  pcbX={-3}
  pcbY={6}
  schX={-10.8}
  schY={2.31}
/>

<capacitor
  name="C_USB_VDD"
  capacitance="100nF"
  footprint="0402"
  schSectionName={schSections.usb}
  schOrientation="vertical"
  pcbX={7.2}
  pcbY={14.5}
  schX={16.41}
  schY={1.2}
/>

<capacitor
  name="C_ADC"
  capacitance="100nF"
  footprint="0402"
  schSectionName={schSections.power}
  schOrientation="vertical"
  pcbX={8}
  pcbY={-4.4}
/>
    {/* RUN pullup */}
<trace {...denseTraceProps} name="RUN_R" from=".R_RUN > .pin1" to=".U1 > .RUN" />
<trace name="RUN_3V3" from=".R_RUN > .pin2" to="net.V3V3" {...v3v3Label} />
<trace {...denseTraceProps} name="RUN_HDR" from=".J_RIGHT > .RUN" to=".R_RUN > .pin1" />

{/* TESTEN */}
<trace name="TEST_G" from=".U1 > .TESTEN" to="net.GND" {...gndLabel} />

{/* Flash decoupling */}
<trace name="FLSH_3V3" from=".C_FLASH > .pin1" to="net.V3V3" {...v3v3Label} />
<trace name="FLSH_G" from=".C_FLASH > .pin2" to="net.GND" {...gndLabel} />

{/* IOVDD decoupling */}
<trace name="IO1_3V3" from=".C_IOVDD1 > .pin1" to="net.V3V3" {...v3v3Label} />
<trace name="IO1_G" from=".C_IOVDD1 > .pin2" to="net.GND" {...gndLabel} />

<trace name="IO2_3V3" from=".C_IOVDD2 > .pin1" to="net.V3V3" {...v3v3Label} />
<trace name="IO2_G" from=".C_IOVDD2 > .pin2" to="net.GND" {...gndLabel} />

{/* USB_VDD decoupling */}
<trace name="UVDD_3V3" from=".C_USB_VDD > .pin1" to="net.V3V3" {...v3v3Label} />
<trace name="UVDD_G" from=".C_USB_VDD > .pin2" to="net.GND" {...gndLabel} />

{/* ADC decoupling */}
<trace name="ADC_REF" from=".C_ADC > .pin1" to="net.ADC_VREF" {...adcRefLabel} />
<trace name="ADC_G" from=".C_ADC > .pin2" to="net.GND" {...gndLabel} />
    
    <connector
      name="J_LEFT"
      manufacturerPartNumber="PICO-LEFT-20P"
      footprint={<PicoHeaderFootprint ports={leftHeaderPortLabels} />}
      pinLabels={leftHeaderPinLabels}
      schSectionName={schSections.headers}
      pcbX={-12.5}
      pcbY={0}
      schX={-11.96}
    />
    <connector
      name="J_RIGHT"
      manufacturerPartNumber="PICO-RIGHT-20P"
      footprint={<PicoHeaderFootprint ports={rightHeaderPortLabels} />}
      pinLabels={rightHeaderPinLabels}
      schSectionName={schSections.headers}
      pcbX={12.5}
      pcbY={0}
      schX={-5.71}
    />
    <TYPE_C_16PIN_2MD_073_
      name="J_USB"
      schSectionName={schSections.usb}
      pcbX={0}
      pcbY={31.0}
      pcbRotation={180}
    />

    <RP2040
      name="U1"
      showPinAliases
      schSectionName={schSections.rp2040}
      pcbX={0}
      pcbY={0.5}
      schX={-0.22}
      schY={-1}
      schWidth={2.8}
      schHeight={5.8}
    />
    <W25Q16JVUXIQ
      name="U2"
      schSectionName={schSections.flash}
      pcbX={3.5}
      pcbY={9.5}
      pcbRotation={90}
      schX={17.32}
      schY={-4.16}
      schHeight={1}
    />
    <AP2112K_3_3TRG1
      name="U3"
      schSectionName={schSections.power}
      pcbX={-7.2}
      pcbY={20.2}
      pcbRotation={0}
      schHeight={0.6}
    />

    <X322512MSB4SI
      name="Y1"
      schSectionName={schSections.clock}
      pcbX={-6.5}
      pcbY={-16}
    />
    <SKRPACE010 name="SW_BOOT" schSectionName={schSections.controls} pcbX={8.6} pcbY={21.8} />
    <SKRPACE010 name="SW_RUN" schSectionName={schSections.controls} pcbX={5.5} pcbY={-12.5} pcbRotation={90} />
    <led name="D1" color="green" footprint="0603" schSectionName={schSections.status} pcbX={10} pcbY={4.2} pcbRotation={270} />
    <led name="D_PWR" color="green" footprint="0603" schSectionName={schSections.status} pcbX={-9.8} pcbY={24.8} pcbRotation={270} />

    <resistor name="R_BOOT" resistance="10k" footprint="0402" schSectionName={schSections.controls} pcbX={5.1} pcbY={17.8} pcbRotation={90} />
    <resistor name="R_LED" resistance="330" footprint="0402" schSectionName={schSections.status} pcbX={7.2} pcbY={1.2} pcbRotation={90} />
    <resistor name="R_PWR_LED" resistance="330" footprint="0402" schSectionName={schSections.status} pcbX={-6.2} pcbY={24.8} pcbRotation={90} />
    <resistor name="R_CC1" resistance="5.1k" footprint="0402" schSectionName={schSections.usb} pcbX={-0.2} pcbY={25.6} />
    <resistor name="R_CC2" resistance="5.1k" footprint="0402" schSectionName={schSections.usb} pcbX={3.6} pcbY={26.5} schX={13.91} schY={-4.12} />
    <resistor name="R_USB1" resistance="27" footprint="0402" schSectionName={schSections.usb} pcbX={-2.4} pcbY={16.5} pcbRotation={90} schX={14.96} schY={-6.1} />
    <resistor name="R_USB2" resistance="27" footprint="0402" schSectionName={schSections.usb} pcbX={2.4} pcbY={16.5} pcbRotation={90} schX={14.96} schY={-8.08} />

    <capacitor name="C_VBUS" capacitance="10uF" footprint="0603" schSectionName={schSections.usb} schOrientation="vertical" pcbX={-2.8} pcbY={26.3} pcbRotation={90} />
    <capacitor name="C_3V3" capacitance="10uF" footprint="0603" schSectionName={schSections.power} schOrientation="vertical" pcbX={-8.5} pcbY={4.2} />
    <capacitor name="C_CORE" capacitance="1uF" footprint="0402" schSectionName={schSections.rp2040} schOrientation="vertical" pcbX={3.8} pcbY={-5.5} schX={-2.8} schY={-4.8} />
    <capacitor name="C_USB" capacitance="1uF" footprint="0402" schSectionName={schSections.usb} schOrientation="vertical" pcbX={9.8} pcbY={18.4} schX={16.11} schY={-1.2} />
    <capacitor name="C_XIN" capacitance="18pF" footprint="0402" schSectionName={schSections.clock} schOrientation="vertical" pcbX={-8.4} pcbY={-11.8} />
    <capacitor name="C_XOUT" capacitance="18pF" footprint="0402" schSectionName={schSections.clock} schOrientation="vertical" pcbX={-2.4} pcbY={-21
    } />
    <inductor name="L_AVDD" inductance="600ohm@100MHz" footprint="0603" schSectionName={schSections.power} pcbX={8.5} pcbY={-1.8} supplierPartNumbers={{ jlcpcb: ["C1002"] }} pcbRotation={90} />

    <testpoint name="TP_SWCLK" footprintVariant="pad" padShape="circle" padDiameter="1.1mm" schSectionName={schSections.debug} pcbX={-6} pcbY={-31} />
    <testpoint name="TP_GND" footprintVariant="pad" padShape="circle" padDiameter="1.1mm" schSectionName={schSections.debug} pcbX={-2} pcbY={-31} />
    <testpoint name="TP_SWDIO" footprintVariant="pad" padShape="circle" padDiameter="1.1mm" schSectionName={schSections.debug} pcbX={2} pcbY={-31} />
    <testpoint name="TP_3V3" footprintVariant="pad" padShape="circle" padDiameter="1.1mm" schSectionName={schSections.debug} pcbX={6} pcbY={-31} />

    <trace name="J_LEFT_GND" from=".J_LEFT > .GND" to="net.GND" {...gndLabel} />
    <trace name="J_LEFT_GND_8" from=".J_LEFT > .GND_8" to="net.GND" {...gndLabel} />
    <trace name="J_LEFT_GND_13" from=".J_LEFT > .GND_13" to="net.GND" {...gndLabel} />
    <trace name="J_LEFT_GND_18" from=".J_LEFT > .GND_18" to="net.GND" {...gndLabel} />
    <trace name="J_RIGHT_VBUS" from=".J_RIGHT > .VBUS" to="net.VBUS" {...vbusLabel} />
    <trace name="J_RIGHT_VSYS" from=".J_RIGHT > .VSYS" to="net.VSYS" {...vsysLabel} />
    <trace name="J_RIGHT_GND" from=".J_RIGHT > .GND" to="net.GND" {...gndLabel} />
    <trace name="J_RIGHT_GND_8" from=".J_RIGHT > .GND_8" to="net.GND" {...gndLabel} />
    <trace name="J_RIGHT_GND_13" from=".J_RIGHT > .GND_13" to="net.GND" {...gndLabel} />
    <trace name="J_RIGHT_GND_18" from=".J_RIGHT > .GND_18" to="net.GND" {...gndLabel} />
    <trace name="J_RIGHT_V3V3_EN" from=".J_RIGHT > .V3V3_EN" to="net.V3V3_EN" schDisplayLabel="3V3_EN" />
    <trace name="J_RIGHT_ADC_VREF" from=".J_RIGHT > .ADC_VREF" to="net.ADC_VREF" {...adcRefLabel} />
    <trace name="J_RIGHT_RUN" from=".J_RIGHT > .RUN" to="net.RUN" {...runLabel} />
    <trace {...denseTraceProps} name="HDR_3V3" from=".J_RIGHT > .V3V3" to=".C_USB > .pin1" {...v3v3Label} />

    <trace {...denseTraceProps} name="GP0" from=".U1 > .GPIO0" to=".J_LEFT > .GP0" schDisplayLabel="GP0" />
    <trace {...denseTraceProps} name="GP1" from=".U1 > .GPIO1" to=".J_LEFT > .GP1" schDisplayLabel="GP1" />
    <trace {...denseTraceProps} name="GP2" from=".U1 > .GPIO2" to=".J_LEFT > .GP2" schDisplayLabel="GP2" />
    <trace {...denseTraceProps} name="GP3" from=".U1 > .GPIO3" to=".J_LEFT > .GP3" schDisplayLabel="GP3" />
    <trace {...denseTraceProps} name="GP4" from=".U1 > .GPIO4" to=".J_LEFT > .GP4" schDisplayLabel="GP4" />
    <trace {...denseTraceProps} name="GP5" from=".U1 > .GPIO5" to=".J_LEFT > .GP5" schDisplayLabel="GP5" />
    <trace {...denseTraceProps} name="GP6" from=".U1 > .GPIO6" to=".J_LEFT > .GP6" schDisplayLabel="GP6" />
    <trace {...denseTraceProps} name="GP7" from=".U1 > .GPIO7" to=".J_LEFT > .GP7" schDisplayLabel="GP7" />
    <trace {...denseTraceProps} name="GP8" from=".U1 > .GPIO8" to=".J_LEFT > .GP8" schDisplayLabel="GP8" />
    <trace {...denseTraceProps} name="GP9" from=".U1 > .GPIO9" to=".J_LEFT > .GP9" schDisplayLabel="GP9" />
    <trace {...denseTraceProps} name="GP10" from=".U1 > .GPIO10" to=".J_LEFT > .GP10" schDisplayLabel="GP10" />
    <trace {...denseTraceProps} name="GP11" from=".U1 > .GPIO11" to=".J_LEFT > .GP11" schDisplayLabel="GP11" />
    <trace {...denseTraceProps} name="GP12" from=".U1 > .GPIO12" to=".J_LEFT > .GP12" schDisplayLabel="GP12" />
    <trace {...denseTraceProps} name="GP13" from=".U1 > .GPIO13" to=".J_LEFT > .GP13" schDisplayLabel="GP13" />
    <trace {...denseTraceProps} name="GP14" from=".U1 > .GPIO14" to=".J_LEFT > .GP14" schDisplayLabel="GP14" />
    <trace {...denseTraceProps} name="GP15" from=".U1 > .GPIO15" to=".J_LEFT > .GP15" schDisplayLabel="GP15" />
    <trace {...denseTraceProps} name="GP16" from=".U1 > .GPIO16" to=".J_RIGHT > .GP16" schDisplayLabel="GP16" />
    <trace {...denseTraceProps} name="GP17" from=".U1 > .GPIO17" to=".J_RIGHT > .GP17" schDisplayLabel="GP17" />
    <trace {...denseTraceProps} name="GP18" from=".U1 > .GPIO18" to=".J_RIGHT > .GP18" schDisplayLabel="GP18" />
    <trace {...denseTraceProps} name="GP19" from=".U1 > .GPIO19" to=".J_RIGHT > .GP19" schDisplayLabel="GP19" />
    <trace {...denseTraceProps} name="GP20" from=".U1 > .GPIO20" to=".J_RIGHT > .GP20" schDisplayLabel="GP20" />
    <trace {...denseTraceProps} name="GP21" from=".U1 > .GPIO21" to=".J_RIGHT > .GP21" schDisplayLabel="GP21" />
    <trace {...denseTraceProps} name="GP22" from=".U1 > .GPIO22" to=".J_RIGHT > .GP22" schDisplayLabel="GP22" />
    <trace {...denseTraceProps} name="GP26_ADC0" from=".U1 > .GPIO26_ADC0" to=".J_RIGHT > .GP26_ADC0" schDisplayLabel="GP26" />
    <trace {...denseTraceProps} name="GP27_ADC1" from=".U1 > .GPIO27_ADC1" to=".J_RIGHT > .GP27_ADC1" schDisplayLabel="GP27" />
    <trace {...denseTraceProps} name="GP28_ADC2" from=".U1 > .GPIO28_ADC2" to=".J_RIGHT > .GP28_ADC2" schDisplayLabel="GP28" />

    <trace {...denseTraceProps} name="QSPI_SS" from=".U1 > .QSPI_SS" to=".U2 > .CS" schDisplayLabel="QSPI_SS" />
    <trace {...denseTraceProps} name="QSPI_SD0" from=".U1 > .QSPI_SD0" to=".U2 > .pin5" schDisplayLabel="QSPI_SD0" />
    <trace {...denseTraceProps} name="QSPI_SD1" from=".U1 > .QSPI_SD1" to=".U2 > .pin2" schDisplayLabel="QSPI_SD1" />
    <trace {...denseTraceProps} name="QSPI_SD2" from=".U1 > .QSPI_SD2" to=".U2 > .pin3" schDisplayLabel="QSPI_SD2" />
    <trace {...denseTraceProps} name="QSPI_SD3" from=".U1 > .QSPI_SD3" to=".U2 > .pin7" schDisplayLabel="QSPI_SD3" />
    <trace {...denseTraceProps} name="QSPI_SCLK" from=".U1 > .QSPI_SCLK" to=".U2 > .CLK" schDisplayLabel="QSPI_SCLK" />

    <trace {...denseTraceProps} name="IOVDD1_P" from=".U1 > .IOVDD1" to="net.V3V3" {...v3v3Label} />
    <trace {...denseTraceProps} name="IOVDD2_P" from=".U1 > .IOVDD2" to="net.V3V3" {...v3v3Label} />
    <trace {...denseTraceProps} name="IOVDD3_P" from=".U1 > .IOVDD3" to="net.V3V3" {...v3v3Label} />
    <trace {...denseTraceProps} name="IOVDD4_P" from=".U1 > .IOVDD4" to="net.V3V3" {...v3v3Label} />
    <trace {...denseTraceProps} name="IOVDD5_P" from=".U1 > .IOVDD5" to="net.V3V3" {...v3v3Label} />
    <trace {...denseTraceProps} name="IOVDD6_P" from=".U1 > .IOVDD6" to="net.V3V3" {...v3v3Label} />
    <trace {...denseTraceProps} name="DVDD1_P" from=".U1 > .DVDD1" to="net.V1V1" {...v1v1Label} />
    <trace {...denseTraceProps} name="DVDD2_P" from=".U1 > .DVDD2" to="net.V1V1" {...v1v1Label} />
    <trace {...denseTraceProps} name="VREG_IN_P" from=".U1 > .VREG_IN" to="net.V3V3" {...v3v3Label} />
    <trace {...denseTraceProps} name="VREG_VOUT_P" from=".U1 > .VREG_VOUT" to="net.V1V1" {...v1v1Label} />
    <trace {...denseTraceProps} name="USB_VDD_P" from=".U1 > .USB_VDD" to="net.V3V3" {...v3v3Label} />
    <trace name="GND_G" from=".U1 > .GND" to="net.GND" {...gndLabel} />
    <trace {...denseTraceProps} name="USBV_IO1" from=".U1 > .USB_VDD" to=".U1 > .IOVDD1" />
    <trace name="VBUS_A" from=".J_USB > .A4B9" to="net.VBUS" {...vbusLabel} />
    <trace name="VBUS_B" from=".J_USB > .B4A9" to="net.VBUS" {...vbusLabel} />
    <trace name="USB_DN_A" from=".J_USB > .A7" to=".R_USB1 > .pin1" />
    <trace {...denseTraceProps} name="USB_DN" from=".R_USB1 > .pin2" to=".U1 > .USB_DM" />
    <trace name="USB_DP_A" from=".J_USB > .A6" to=".R_USB2 > .pin1" />
    <trace {...denseTraceProps} name="USB_DP" from=".R_USB2 > .pin2" to=".U1 > .USB_DP" />
    <trace {...denseTraceProps} name="CC1" from=".J_USB > .A5" to=".R_CC1 > .pin1" />
    <trace {...denseTraceProps} name="CC2" from=".J_USB > .B5" to=".R_CC2 > .pin1" />
    <trace {...denseTraceProps} name="USB_G" from=".J_USB > .A1B12" to="net.GND" {...gndLabel} />
    <trace {...denseTraceProps} name="USB_G_B" from=".J_USB > .B1A12" to="net.GND" {...gndLabel} />
    <trace {...denseTraceProps} name="USB_EH1" from=".J_USB > .EH1" to="net.GND" {...gndLabel} />
    <trace {...denseTraceProps} name="USB_EH1_ALT" from=".J_USB > .pin13_alt1" to="net.GND" {...gndLabel} />
    <trace {...denseTraceProps} name="USB_EH2" from=".J_USB > .EH2" to="net.GND" {...gndLabel} />
    <trace {...denseTraceProps} name="USB_EH2_ALT" from=".J_USB > .pin14_alt1" to="net.GND" {...gndLabel} />
    <trace name="CC1_G" from=".R_CC1 > .pin2" to="net.GND" {...gndLabel} />
    <trace name="CC2_G" from=".R_CC2 > .pin2" to="net.GND" {...gndLabel} />

    <trace name="VBUS_C" from="net.VBUS" to=".C_VBUS > .pin1" {...vbusLabel} />
    <trace name="VBUS_G" from=".C_VBUS > .pin2" to="net.GND" {...gndLabel} />

    <trace name="VSYS_IN" from="net.VSYS" to=".U3 > .VIN" {...vsysLabel} />

    <trace name="REG_3V3" from=".U3 > .VOUT" to="net.V3V3" {...v3v3Label} />
    <trace name="REG_G" from=".U3 > .GND" to="net.GND" {...gndLabel} />
    <trace name="C3V3_P" from=".C_3V3 > .pin1" to="net.V3V3" {...v3v3Label} />
    <trace name="C3V3_G" from=".C_3V3 > .pin2" to="net.GND" {...gndLabel} />
    <trace name="CORE_P" from=".C_CORE > .pin1" to="net.V1V1" {...v1v1Label} />
    <trace name="CORE_G" from=".C_CORE > .pin2" to="net.GND" {...gndLabel} />
    <trace name="CUSB_P" from=".C_USB > .pin1" to="net.V3V3" {...v3v3Label} />
    <trace name="CUSB_G" from=".C_USB > .pin2" to="net.GND" {...gndLabel} />
    <trace name="AVDD_IN" from=".L_AVDD > .pin1" to="net.V3V3" {...v3v3Label} />
    <trace name="AVDD" from=".L_AVDD > .pin2" to="net.ADC_VREF" {...adcRefLabel} />
    <trace name="ADC_AVDD" from=".U1 > .ADC_AVDD" to="net.ADC_VREF" {...adcRefLabel} />
    <trace name="FLSH_GND" from=".U2 > .GND" to="net.GND" {...gndLabel} />
    <trace name="FLSH_VCC" from=".U2 > .VCC" to="net.V3V3" {...v3v3Label} />
    <trace name="FLSH_EP" from=".U2 > .EP" to="net.GND" {...gndLabel} />

    <trace name="XIN" from=".Y1 > .OSC1" to=".U1 > .XIN" />
    <trace name="XOUT" from=".Y1 > .OSC2" to=".U1 > .XOUT" />
    <trace name="CXIN" from=".C_XIN > .pin1" to=".Y1 > .OSC1" />
    <trace name="CXIN_G" from=".C_XIN > .pin2" to="net.GND" {...gndLabel} />
    <trace name="CXOUT" from=".C_XOUT > .pin1" to=".Y1 > .OSC2" />
    <trace name="CXOUT_G" from=".C_XOUT > .pin2" to="net.GND" {...gndLabel} />

    <trace name="BOOT_SW" from=".SW_BOOT > .pin1" to=".U1 > .QSPI_SS" />
    <trace name="BOOT_G" from=".SW_BOOT > .pin3" to="net.GND" {...gndLabel} />
    <trace name="BOOT_R" from=".R_BOOT > .pin1" to=".U1 > .QSPI_SS" />
    <trace name="BOOT_3V3" from=".R_BOOT > .pin2" to="net.V3V3" {...v3v3Label} />
    <trace name="RUN_SW" from=".SW_RUN > .pin1" to=".U1 > .RUN" />
    <trace name="RUN_G" from=".SW_RUN > .pin4" to="net.GND" {...gndLabel} />

    <trace name="LED_GP25" from=".U1 > .GPIO25" to=".R_LED > .pin1" />
    <trace name="LED_D1" from=".R_LED > .pin2" to=".D1 > .pin1" />
    <trace name="LED_G" from=".D1 > .pin2" to="net.GND" {...gndLabel} />
    <trace name="PLED_3V3" from="net.V3V3" to=".R_PWR_LED > .pin1" {...v3v3Label} />
    <trace name="PLED_D" from=".R_PWR_LED > .pin2" to=".D_PWR > .pin1" />
    <trace name="PLED_G" from=".D_PWR > .pin2" to="net.GND" {...gndLabel} />

    <trace name="SWCLK" from=".U1 > .SWCLK" to=".TP_SWCLK > .pin1" />
    <trace name="SWD" from=".U1 > .SWD" to=".TP_SWDIO > .pin1" />
    <trace name="TP_G" from=".TP_GND > .pin1" to="net.GND" {...gndLabel} />
    <trace name="TP3V3_T" from=".TP_3V3 > .pin1" to="net.V3V3" {...v3v3Label} />

    <silkscreentext text="Abse-Pico" fontSize="2mm" pcbX={-8} pcbY={-33} pcbRotation={0} />
    <silkscreentext text="Tscircuit" fontSize="7mm" pcbX={0} pcbY={0} pcbRotation={90} layer="bottom" />
    <silkscreentext text="TSC" isKnockout  fontSize="2mm" pcbX={12} pcbY={-33} />
    <silkscreentext text="BOOT" fontSize="0.8mm" pcbX={12} pcbY={14} />
    <silkscreentext text="RUN" fontSize="0.8mm" pcbX={-12} pcbY={-30} />
    <silkscreentext text="PWR" fontSize="0.8mm" pcbX={-9.8} pcbY={27.4} />
    <silkscreentext text="USB-C" fontSize="0.9mm" pcbX={0} pcbY={25} />
  </subcircuit>
)
