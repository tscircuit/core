import { CYPD3177_24LQXQT } from "./cypd3177"
import { AO4407A } from "./ao4407a"
import { USB4085_GF_A } from "./usb4085"
import { MMBT3904_RANGE_100_300_ } from "./mmbt3904"

// Complete PD sheet from 0hmX/dual-usb-peltier-assembly v0.4.7:
// https://github.com/0hmX/usb-c-peltier-board/blob/a7390c99ad832657cb98bb91c7a8e9738be6195a/src/board/general-pd.tsx
// Keep the schematic symbols, placement, connections, and explicit labels.
// PCB footprints/models and the other eight sheets are outside this reproduction.
export function PdSheet() {
  return (
    <board routingDisabled schTraceAutoLabelEnabled schMaxTraceDistance={8}>
      <net name="GND" isGroundNet />
      <schematicsheet
        name="PD"
        displayName="100 W USB-C PD input"
        sheetIndex={1}
      />
      <USB4085_GF_A
        name="J_USB"
        schX={-11}
        schY={4.2}
        schRotation={0}
        schSheetName="PD"
        connections={{
          pin1: "net.CC1",
          pin14: "net.CC2",
          pin2: "net.GND",
          pin8: "net.GND",
          pin9: "net.GND",
          pin16: "net.GND",
          pin17: "net.GND",
          pin3: "net.VBUS_RAW",
          pin7: "net.VBUS_RAW",
          pin10: "net.VBUS_RAW",
          pin15: "net.VBUS_RAW",
        }}
        noConnect={["pin4", "pin5", "pin6", "pin11", "pin12", "pin13"]}
      />
      <CYPD3177_24LQXQT
        name="U_PD"
        schX={-2}
        schY={2.5}
        schRotation={0}
        schSheetName="PD"
        schWidth={4.5}
        schHeight={4.8}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: [
              "CC1",
              "CC2",
              "D_NEG",
              "D_POS",
              "HPI_INT",
              "GPIO_1",
              "FLIP",
              "HPI_SDA",
              "HPI_SCL",
            ],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: [
              "VBUS_FET_EN",
              "VDC_OUT",
              "FAULT",
              "SAFE_PWR_EN",
              "DNU1",
              "DNU2",
            ],
          },
          topSide: {
            direction: "left-to-right",
            pins: [
              "VBUS_IN",
              "VBUS_MIN",
              "VBUS_MAX",
              "ISNK_COARSE",
              "ISNK_FINE",
            ],
          },
          bottomSide: {
            direction: "left-to-right",
            pins: ["VDDD", "VCCD", "GND1", "GND2", "EP"],
          },
        }}
        connections={{
          // Datasheet tables 2–4: MIN=MAX=20 V, COARSE=5 A, FINE=0 A.
          pin1: "net.PD_3V3",
          pin2: "net.PD_3V3",
          pin3: "net.PD_GATE_DRIVE",
          pin5: "net.PD_3V3",
          pin6: "net.GND",
          pin9: "net.PD_FAULT",
          pin11: "net.PD_VDC_OUT",
          pin14: "net.CC2",
          pin15: "net.CC1",
          pin18: "net.VBUS_RAW",
          pin19: "net.GND",
          pin22: "net.GND",
          pin23: "net.PD_3V3",
          pin24: "net.PD_CORE",
          pin25: "net.GND",
        }}
        noConnect={[
          "SAFE_PWR_EN",
          "HPI_INT",
          "GPIO_1",
          "FLIP",
          "HPI_SDA",
          "HPI_SCL",
          "DNU1",
          "DNU2",
          "D_NEG",
          "D_POS",
        ]}
      />
      {/* Every parallel MOSFET source and drain pin is wired explicitly. */}
      <AO4407A
        name="Q_INPUT"
        schX={7.5}
        schY={5}
        schRotation={0}
        schSheetName="PD"
      />
      <trace from=".Q_INPUT > .pin1" to="net.PFET_SOURCE" />
      <trace from=".Q_INPUT > .pin2" to="net.PFET_SOURCE" />
      <trace from=".Q_INPUT > .pin3" to="net.PFET_SOURCE" />
      <trace from=".Q_INPUT > .pin4" to="net.PD_GATE" />
      <trace from=".Q_INPUT > .pin5" to="net.VBUS_RAW" />
      <trace from=".Q_INPUT > .pin6" to="net.VBUS_RAW" />
      <trace from=".Q_INPUT > .pin7" to="net.VBUS_RAW" />
      <trace from=".Q_INPUT > .pin8" to="net.VBUS_RAW" />
      <AO4407A
        name="Q_REVERSE"
        schX={13}
        schY={5}
        schRotation={0}
        schSheetName="PD"
      />
      <trace from=".Q_REVERSE > .pin1" to="net.PFET_SOURCE" />
      <trace from=".Q_REVERSE > .pin2" to="net.PFET_SOURCE" />
      <trace from=".Q_REVERSE > .pin3" to="net.PFET_SOURCE" />
      <trace from=".Q_REVERSE > .pin4" to="net.PD_GATE" />
      <trace from=".Q_REVERSE > .pin5" to="net.VBUS_QUALIFIED" />
      <trace from=".Q_REVERSE > .pin6" to="net.VBUS_QUALIFIED" />
      <trace from=".Q_REVERSE > .pin7" to="net.VBUS_QUALIFIED" />
      <trace from=".Q_REVERSE > .pin8" to="net.VBUS_QUALIFIED" />
      <capacitor
        capacitance="4.7uF"
        manufacturerPartNumber="GRM31CC72A475KE11L"
        name="C_USB"
        schX={-8}
        schY={7}
        schRotation={270}
        schSheetName="PD"
        connections={{ pin1: "net.VBUS_RAW", pin2: "net.GND" }}
      />
      <capacitor
        capacitance="100nF"
        manufacturerPartNumber="CC0603KRX7R9BB104"
        name="C_PD_VBUS"
        maxVoltageRating="50V"
        schX={-5.5}
        schY={7}
        schRotation={270}
        schSheetName="PD"
        connections={{ pin1: "net.VBUS_RAW", pin2: "net.GND" }}
      />
      <capacitor
        capacitance="1uF"
        manufacturerPartNumber="CC0603KRX7R8BB105"
        name="C_PD_3V3"
        maxVoltageRating="25V"
        schX={-7}
        schY={-1.5}
        schRotation={270}
        schSheetName="PD"
        connections={{ pin1: "net.PD_3V3", pin2: "net.GND" }}
      />
      <capacitor
        capacitance="100nF"
        manufacturerPartNumber="CC0603KRX7R9BB104"
        name="C_PD_3V3_HF1"
        maxVoltageRating="50V"
        schX={-4}
        schY={-1.5}
        schRotation={270}
        schSheetName="PD"
        connections={{ pin1: "net.PD_3V3", pin2: "net.GND" }}
      />
      <capacitor
        capacitance="100nF"
        manufacturerPartNumber="CC0603KRX7R9BB104"
        name="C_PD_3V3_HF2"
        maxVoltageRating="50V"
        schX={-1}
        schY={-1.5}
        schRotation={270}
        schSheetName="PD"
        connections={{ pin1: "net.PD_3V3", pin2: "net.GND" }}
      />
      <capacitor
        capacitance="1uF"
        manufacturerPartNumber="CC0603KRX7R8BB105"
        name="C_PD_CORE"
        maxVoltageRating="25V"
        schX={2}
        schY={-1.5}
        schRotation={270}
        schSheetName="PD"
        connections={{ pin1: "net.PD_CORE", pin2: "net.GND" }}
      />
      <MMBT3904_RANGE_100_300_
        name="Q_PD_FAULT"
        schX={-2}
        schY={-6}
        schRotation={0}
        schSheetName="PD"
        connections={{
          pin1: "net.PD_FAULT_BASE",
          pin2: "net.GND",
          pin3: "net.DRIVER_ENABLE",
        }}
      />
      <resistor
        name="R_GATE"
        resistance="1k"
        schX={3.5}
        schY={5}
        schRotation={0}
        schSheetName="PD"
        manufacturerPartNumber="0603WAF1001T5E"
        connections={{ pin1: "net.PD_GATE_DRIVE", pin2: "net.PD_GATE" }}
      />
      <resistor
        name="R_GATE_OFF"
        resistance="49.9k"
        schX={10.5}
        schY={2}
        schRotation={90}
        schSheetName="PD"
        manufacturerPartNumber="0603WAF4992T5E"
        connections={{ pin1: "net.PFET_SOURCE", pin2: "net.PD_GATE" }}
      />
      <resistor
        name="R_DC_SENSE"
        resistance="1k"
        schX={13}
        schY={0}
        schRotation={270}
        schSheetName="PD"
        manufacturerPartNumber="0603WAF1001T5E"
        connections={{ pin1: "net.VBUS_QUALIFIED", pin2: "net.PD_VDC_OUT" }}
      />
      <resistor
        name="R_FAULT_BASE"
        resistance="10k"
        schX={-6}
        schY={-6}
        schRotation={0}
        schSheetName="PD"
        manufacturerPartNumber="0603WAF1002T5E"
        connections={{ pin1: "net.PD_FAULT", pin2: "net.PD_FAULT_BASE" }}
      />
      <resistor
        name="R_FAULT_OFF"
        resistance="100k"
        schX={-3.5}
        schY={-8}
        schRotation={270}
        schSheetName="PD"
        manufacturerPartNumber="0603WAF1003T5E"
        connections={{ pin1: "net.PD_FAULT_BASE", pin2: "net.GND" }}
      />
      <group schSheetName="PD">
        <schematictext
          text="100 W USB-C PD INPUT"
          schX={-11}
          schY={9.5}
          fontSize={0.35}
          anchor="left"
        />
        <schematictext
          text="20 V / 5 A contract - use a 5 A e-marked cable"
          schX={-11}
          schY={8.7}
          fontSize={0.22}
          anchor="left"
        />
        <schematictext
          text="Back-to-back P-FETs"
          schX={7.5}
          schY={8.5}
          fontSize={0.25}
          anchor="left"
        />
        <schematictext
          text="Straps: MIN = MAX = 20 V; COARSE = 5 A; FINE = 0 A"
          schX={-10}
          schY={-3.8}
          fontSize={0.22}
          anchor="left"
        />
        <schematictext
          text="PD FAULT disables the load converter"
          schX={-10}
          schY={-5}
          fontSize={0.25}
          anchor="left"
        />
        <netlabel
          net="GND"
          connection=".J_USB > .pin2"
          schX={-10.3}
          schY={1.4}
          anchorSide="top"
        />
        <netlabel
          net="GND"
          connection=".U_PD > .pin19"
          schX={-1.6}
          schY={-0.8}
          anchorSide="top"
        />
        <netlabel
          net="GND"
          connection=".C_USB > .pin2"
          schX={-8}
          schY={5.3}
          anchorSide="top"
        />
        <netlabel
          net="GND"
          connection=".C_PD_VBUS > .pin2"
          schX={-5.5}
          schY={5.3}
          anchorSide="top"
        />
        <netlabel
          net="GND"
          connection=".C_PD_3V3 > .pin2"
          schX={-7}
          schY={-2.7}
          anchorSide="top"
        />
        <netlabel
          net="GND"
          connection=".C_PD_3V3_HF1 > .pin2"
          schX={-4}
          schY={-2.7}
          anchorSide="top"
        />
        <netlabel
          net="GND"
          connection=".C_PD_3V3_HF2 > .pin2"
          schX={-1}
          schY={-2.7}
          anchorSide="top"
        />
        <netlabel
          net="GND"
          connection=".C_PD_CORE > .pin2"
          schX={2}
          schY={-2.7}
          anchorSide="top"
        />
        <netlabel
          net="GND"
          connection=".Q_PD_FAULT > .pin2"
          schX={-2}
          schY={-7.1}
          anchorSide="top"
        />
        <netlabel
          net="GND"
          connection=".R_FAULT_OFF > .pin2"
          schX={-3.5}
          schY={-9.1}
          anchorSide="top"
        />
      </group>
    </board>
  )
}
