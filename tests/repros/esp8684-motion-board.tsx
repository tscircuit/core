import {
  ESP8684H4X,
  S18_L262B_2,
  AP2112K_3_3TRG1,
  MMBT3904_RANGE_100_300_,
  U_FL_R_SMT_1_80_,
  A_3225_40M_12PF_10PPM,
} from "./esp8684-motion-board-components"

const upperPins = [
  "BAT",
  "GND",
  "3V3",
  "EN",
  "TX20",
  "RX19",
  "BOOT9",
  "IO8",
  "IO18",
  "IO10",
]
const lowerPins = [
  "LED+",
  "LED-",
  "IO0",
  "IO1",
  "PIR2",
  "IO3",
  "IO4",
  "IO5",
  "IO6",
  "LED7",
]
const upperNets = [
  "VBAT",
  "GND",
  "V3V3",
  "EN",
  "UART_TX",
  "GPIO19",
  "GPIO9",
  "GPIO8",
  "GPIO18",
  "GPIO10",
]
const lowerNets = [
  "LED_POS",
  "LED_NEG",
  "GPIO0",
  "GPIO1",
  "GPIO2",
  "GPIO3",
  "GPIO4",
  "GPIO5",
  "GPIO6",
  "GPIO7",
]

export default function CompactMotionBoard() {
  return (
    <board schAutoLayoutEnabled schTraceAutoLabelEnabled>
      <net name="CHIP_TX" />
      <net name="EN" />
      <net name="GPIO0" />
      <net name="GPIO1" />
      <net name="GPIO10" />
      <net name="GPIO18" />
      <net name="GPIO19" />
      <net name="GPIO2" />
      <net name="GPIO3" />
      <net name="GPIO4" />
      <net name="GPIO5" />
      <net name="GPIO6" />
      <net name="GPIO7" />
      <net name="GPIO8" />
      <net name="GPIO9" />
      <net name="LED_BASE" />
      <net name="LED_NEG" />
      <net name="LED_POS" />
      <net name="RF_ANT" />
      <net name="RF_CHIP" />
      <net name="UART_TX" />
      <net name="XTAL_LOAD" />
      <net name="XTAL_N" />
      <net name="XTAL_P" />
      <net name="GND" isGroundNet />
      <net name="VBAT" isPowerNet nominalTraceWidth="0.4mm" />
      <net name="V3V3" isPowerNet nominalTraceWidth="0.3mm" />
      <net name="V3V3_RF" isPowerNet nominalTraceWidth="0.3mm" />
      <net name="PIR_VDD" isPowerNet />
      <schematicsection name="power" displayName="1S LiPo → 3.3 V / 600 mA" />
      <schematicsection
        name="mcu"
        displayName="ESP8684H4X / all 14 GPIOs exposed"
      />
      <schematicsection
        name="clock"
        displayName="40 MHz crystal — configure firmware"
      />
      <schematicsection
        name="rf"
        displayName="2.4 GHz / external 50 ohm antenna"
      />
      <schematicsection
        name="pir"
        displayName="Digital PIR / separate SB-F-11 lens"
      />
      <schematicsection
        name="led"
        displayName="Indicator LED / switched cathode"
      />
      <schematicsection
        name="headers"
        displayName="2 × 1x10 male headers / 2.54 mm"
      />

      <pinheader
        name="J1"
        pinCount={10}
        pitch="2.54mm"
        gender="male"
        pinLabels={upperPins}
        schSectionName="headers"
        schWidth={0.675}
        connections={Object.fromEntries(
          upperNets.map((net, i) => [`pin${i + 1}`, `net.${net}`]),
        )}
      />
      <pinheader
        name="J2"
        pinCount={10}
        pitch="2.54mm"
        gender="male"
        pinLabels={lowerPins.map((label) =>
          label.replace("+", "_POS").replace("-", "_NEG"),
        )}
        schSectionName="headers"
        schWidth={0.865}
        connections={Object.fromEntries(
          lowerNets.map((net, i) => [`pin${i + 1}`, `net.${net}`]),
        )}
      />
      <AP2112K_3_3TRG1
        name="U3"
        schSectionName="power"
        schWidth={1.865}
        connections={{
          VIN: "net.VBAT",
          EN: "net.VBAT",
          GND: "net.GND",
          VOUT: "net.V3V3",
        }}
      />
      <capacitor
        name="C1"
        capacitance="10uF"
        maxVoltageRating="10V"
        schRotation={-90}
        schSectionName="power"
        connections={{ pin1: "net.VBAT", pin2: "net.GND" }}
      />
      <capacitor
        name="C2"
        capacitance="10uF"
        maxVoltageRating="10V"
        schRotation={-90}
        schSectionName="power"
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />

      <ESP8684H4X
        name="U1"
        schSectionName="mcu"
        schWidth={2.72}
        schHeight={3}
        schMarginX="2mm"
        schPinArrangement={{
          leftSide: [2, 3, 11, 17, 21, 24, 7, 22, 23, 1, 25],
          rightSide: [4, 5, 6, 8, 9, 10, 12, 13, 14, 15, 16, 18, 19, 20],
        }}
        connections={{
          pin1: "net.RF_CHIP",
          pin2: "net.V3V3_RF",
          pin3: "net.V3V3_RF",
          pin4: "net.GPIO0",
          pin5: "net.GPIO1",
          pin6: "net.GPIO2",
          pin7: "net.EN",
          pin8: "net.GPIO3",
          pin9: "net.GPIO4",
          pin10: "net.GPIO5",
          pin11: "net.V3V3",
          pin12: "net.GPIO6",
          pin13: "net.GPIO7",
          pin14: "net.GPIO8",
          pin15: "net.GPIO9",
          pin16: "net.GPIO10",
          pin17: "net.V3V3",
          pin18: "net.GPIO18",
          pin19: "net.GPIO19",
          pin20: "net.CHIP_TX",
          pin21: "net.V3V3",
          pin22: "net.XTAL_N",
          pin23: "net.XTAL_P",
          pin24: "net.V3V3",
          pin25: "net.GND",
        }}
      />
      <inductor
        name="L1"
        inductance="2nH"
        maxCurrentRating="600mA"
        schSectionName="power"
        connections={{ pin1: "net.V3V3", pin2: "net.V3V3_RF" }}
      />
      {[
        { name: "C3", value: "10uF", net: "V3V3" },
        { name: "C4", value: "100nF", net: "V3V3" },
        { name: "C5", value: "100nF", net: "V3V3" },
        { name: "C6", value: "100nF", net: "V3V3" },
        { name: "C7", value: "1uF", net: "V3V3" },
        { name: "C8", value: "10nF", net: "V3V3" },
      ].map((c) => (
        <capacitor
          key={c.name}
          name={c.name}
          capacitance={c.value}
          maxVoltageRating="10V"
          schRotation={-90}
          schSectionName="power"
          connections={{ pin1: `net.${c.net}`, pin2: "net.GND" }}
        />
      ))}
      <resistor
        name="R1"
        resistance="10k"
        schRotation={-90}
        schSectionName="mcu"
        connections={{ pin1: "net.V3V3", pin2: "net.EN" }}
      />
      <capacitor
        name="C9"
        capacitance="1uF"
        maxVoltageRating="10V"
        schRotation={-90}
        schSectionName="mcu"
        connections={{ pin1: "net.EN", pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="10k"
        schRotation={-90}
        schSectionName="mcu"
        connections={{ pin1: "net.V3V3", pin2: "net.GPIO9" }}
      />
      <resistor
        name="R3"
        resistance="10k"
        schRotation={-90}
        schSectionName="mcu"
        connections={{ pin1: "net.V3V3", pin2: "net.GPIO8" }}
      />
      <resistor
        name="R4"
        resistance="499"
        schSectionName="mcu"
        connections={{ pin1: "net.CHIP_TX", pin2: "net.UART_TX" }}
      />

      <U_FL_R_SMT_1_80_
        name="J3"
        schSectionName="rf"
        schWidth={1.96}
        connections={{ SIG: "net.RF_ANT", GND1: "net.GND", GND2: "net.GND" }}
      />
      <capacitor
        name="C10"
        capacitance="1.5pF"
        maxVoltageRating="25V"
        schRotation={-90}
        schSectionName="rf"
        connections={{ pin1: "net.RF_CHIP", pin2: "net.GND" }}
      />
      <inductor
        name="L2"
        inductance="2.7nH"
        schMarginX="0.5mm"
        schMarginY="0.5mm"
        schSectionName="rf"
        connections={{ pin1: "net.RF_ANT", pin2: "net.RF_CHIP" }}
      />
      <capacitor
        name="C11"
        capacitance="1.5pF"
        maxVoltageRating="25V"
        schRotation={-90}
        schSectionName="rf"
        connections={{ pin1: "net.RF_ANT", pin2: "net.GND" }}
      />

      <A_3225_40M_12PF_10PPM
        name="Y1"
        loadCapacitance="12pF"
        schSectionName="clock"
        connections={{
          pin1: "net.XTAL_LOAD",
          pin2: "net.GND",
          pin3: "net.XTAL_N",
          pin4: "net.GND",
        }}
      />
      <inductor
        name="L3"
        inductance="24nH"
        schSectionName="clock"
        connections={{ pin1: "net.XTAL_P", pin2: "net.XTAL_LOAD" }}
      />
      <capacitor
        name="C12"
        capacitance="18pF"
        maxVoltageRating="25V"
        schRotation={-90}
        schSectionName="clock"
        connections={{ pin1: "net.XTAL_LOAD", pin2: "net.GND" }}
      />
      <capacitor
        name="C13"
        capacitance="18pF"
        maxVoltageRating="25V"
        schRotation={-90}
        schSectionName="clock"
        connections={{ pin1: "net.XTAL_N", pin2: "net.GND" }}
      />

      <S18_L262B_2
        name="U2"
        schSectionName="pir"
        schWidth={2.15}
        schHeight={0.8}
        connections={{
          REL: "net.GPIO2",
          ONTIME: "net.GND",
          OEN: "net.PIR_VDD",
          VDD: "net.PIR_VDD",
          SENS: "net.GND",
          VSS: "net.GND",
        }}
      />
      <resistor
        name="R5"
        resistance="100"
        schRotation={-90}
        schSectionName="pir"
        connections={{ pin1: "net.V3V3", pin2: "net.PIR_VDD" }}
      />
      <capacitor
        name="C14"
        capacitance="1uF"
        maxVoltageRating="10V"
        schRotation={-90}
        schSectionName="pir"
        connections={{ pin1: "net.PIR_VDD", pin2: "net.GND" }}
      />
      <capacitor
        name="C15"
        capacitance="100nF"
        maxVoltageRating="10V"
        schRotation={-90}
        schSectionName="pir"
        connections={{ pin1: "net.PIR_VDD", pin2: "net.GND" }}
      />

      <MMBT3904_RANGE_100_300_
        name="Q1"
        schSectionName="led"
        connections={{ B: "net.LED_BASE", E: "net.GND", C: "net.LED_NEG" }}
      />
      <resistor
        name="R6"
        resistance="150"
        schRotation={-90}
        schSectionName="led"
        connections={{ pin1: "net.VBAT", pin2: "net.LED_POS" }}
      />
      <resistor
        name="R7"
        resistance="2.2k"
        schSectionName="led"
        connections={{ pin1: "net.GPIO7", pin2: "net.LED_BASE" }}
      />
      <resistor
        name="R8"
        resistance="100k"
        schRotation={-90}
        schSectionName="led"
        connections={{ pin1: "net.LED_BASE", pin2: "net.GND" }}
      />

      <trace name="RF_CHIP_FEED" from=".U1 > .pin1" to=".L2 > .pin2" />
      <trace name="RF_CHIP_SHUNT" from=".C10 > .pin1" to=".L2 > .pin2" />
      <trace name="RF_ANT_FEED" from=".L2 > .pin1" to=".J3 > .pin1" />
      <trace name="RF_ANT_SHUNT" from=".C11 > .pin1" to=".L2 > .pin1" />
      <trace name="XTAL_P_FEED" from=".U1 > .pin23" to=".L3 > .pin1" />
      <trace name="XTAL_LOAD_FEED" from=".L3 > .pin2" to=".Y1 > .pin1" />
      <trace name="XTAL_N_FEED" from=".U1 > .pin22" to=".Y1 > .pin3" />

      <trace name="XTAL_LOAD_CAP" from=".C12 > .pin1" to=".Y1 > .pin1" />
      <trace name="XTAL_N_CAP" from=".C13 > .pin1" to=".Y1 > .pin3" />
    </board>
  )
}
