import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Reproduces the multi-sheet power-supply schematic where components and net
 * labels rendered inside both sheet frames, but every local schematic trace
 * disappeared from the stacked view.
 *
 * The circuit deliberately places every component and its
 * `connections`-generated traces directly inside a `<schematicsheet>`, with
 * components divided into schematic sections on both sheets. There are no
 * groups or subcircuits involved: Core must infer sheet ownership from the
 * component tree and stamp every resulting schematic trace with the sheet it
 * belongs to.
 */
test("repro156: sectioned schematic-sheet children retain routed traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet
        name="ac_input"
        displayName="1. AC Input, Protection & Rectifier"
        sheetIndex={0}
      >
        <schematicsection
          name="protection"
          displayName="Protection & EMI Filter"
        />
        <schematicsection name="rectifier" displayName="Rectifier & HV Bus" />

        <connector
          name="J1"
          footprint="pinrow2_p2.54mm"
          pinLabels={{ pin1: "LINE", pin2: "NEUTRAL" }}
          schX={-7}
          schY={0.8}
          schSectionName="protection"
          connections={{ LINE: "net.LINE", NEUTRAL: "net.NEUTRAL" }}
        />
        <fuse
          name="F1"
          currentRating="3.15A"
          footprint="1206"
          schX={-5.2}
          schY={0.8}
          schSectionName="protection"
          connections={{ pin1: "net.LINE", pin2: "net.LINE_FUSED" }}
        />
        <resistor
          name="R1"
          resistance="5"
          footprint="1206"
          schX={-3.4}
          schY={0.8}
          schSectionName="protection"
          connections={{
            pin1: "net.LINE_FUSED",
            pin2: "net.LINE_LIMITED",
          }}
        />
        <resistor
          name="MOV1"
          resistance="1M"
          footprint="1206"
          schX={-3.4}
          schY={-1.4}
          schSectionName="protection"
          connections={{
            pin1: "net.LINE_LIMITED",
            pin2: "net.NEUTRAL",
          }}
        />
        <chip
          name="LCM1"
          footprint="soic8"
          schX={-0.5}
          schY={0.4}
          schSectionName="protection"
          pinLabels={{
            pin1: "LINE_IN",
            pin2: "NEUTRAL_IN",
            pin3: "LINE_OUT",
            pin4: "NEUTRAL_OUT",
          }}
          schPinArrangement={{
            leftSide: {
              direction: "top-to-bottom",
              pins: ["LINE_IN", "NEUTRAL_IN"],
            },
            rightSide: {
              direction: "top-to-bottom",
              pins: ["LINE_OUT", "NEUTRAL_OUT"],
            },
          }}
          connections={{
            LINE_IN: "net.LINE_LIMITED",
            NEUTRAL_IN: "net.NEUTRAL",
            LINE_OUT: "net.LINE_EMI",
            NEUTRAL_OUT: "net.NEUTRAL_EMI",
          }}
        />
        <capacitor
          name="C1"
          capacitance="470nF"
          footprint="1206"
          schX={-1.7}
          schY={-1.5}
          schSectionName="protection"
          connections={{
            pin1: "net.LINE_LIMITED",
            pin2: "net.NEUTRAL",
          }}
        />
        <capacitor
          name="C2"
          capacitance="330nF"
          footprint="1206"
          schX={1}
          schY={-1.5}
          schSectionName="protection"
          connections={{ pin1: "net.LINE_EMI", pin2: "net.NEUTRAL_EMI" }}
        />

        <chip
          name="DB1"
          footprint="soic8"
          schX={3.6}
          schY={0.4}
          schSectionName="rectifier"
          pinLabels={{
            pin1: "AC1",
            pin2: "AC2",
            pin3: "NEG",
            pin4: "POS",
          }}
          schPinArrangement={{
            leftSide: {
              direction: "top-to-bottom",
              pins: ["AC1", "AC2"],
            },
            rightSide: {
              direction: "top-to-bottom",
              pins: ["NEG", "POS"],
            },
          }}
          connections={{
            AC1: "net.LINE_EMI",
            AC2: "net.NEUTRAL_EMI",
            NEG: "net.HOT_GND",
            POS: "net.HV_BUS",
          }}
        />
        <resistor
          name="R2"
          resistance="1M"
          footprint="1206"
          schX={2.3}
          schY={-1.6}
          schSectionName="rectifier"
          connections={{ pin1: "net.HV_BUS", pin2: "R3.pin1" }}
        />
        <resistor
          name="R3"
          resistance="1M"
          footprint="1206"
          schX={4.3}
          schY={-1.6}
          schSectionName="rectifier"
          connections={{ pin2: "net.HOT_GND" }}
        />
        <capacitor
          name="C3"
          capacitance="100uF"
          footprint="1206"
          schX={5.8}
          schY={-0.8}
          schSectionName="rectifier"
          connections={{ pin1: "net.HV_BUS", pin2: "net.HOT_GND" }}
        />
      </schematicsheet>

      <schematicsheet
        name="active_clamp"
        displayName="2. GaN Active-Clamp Flyback"
        sheetIndex={1}
      >
        <schematicsection
          name="auxiliary_supply"
          displayName="Auxiliary Supply"
        />
        <schematicsection
          name="primary_control"
          displayName="Primary Control"
        />
        <schematicsection
          name="flyback_transformer"
          displayName="Flyback Transformer"
        />

        <capacitor
          name="C8"
          capacitance="10uF"
          footprint="0805"
          schX={-7}
          schY={1.8}
          schSectionName="auxiliary_supply"
          connections={{
            pin1: "net.VDD_PRIMARY",
            pin2: "net.PRIMARY_GND",
          }}
        />
        <capacitor
          name="C9"
          capacitance="1uF"
          footprint="0603"
          schX={-5.2}
          schY={1.8}
          schSectionName="auxiliary_supply"
          connections={{ pin1: "net.AUX_RAW", pin2: "net.PRIMARY_GND" }}
        />
        <diode
          name="D7"
          footprint="sod123"
          schX={-3.4}
          schY={1.8}
          schSectionName="auxiliary_supply"
          connections={{
            anode: "net.AUX_RAW",
            cathode: "net.VDD_PRIMARY",
          }}
        />
        <inductor
          name="L3"
          inductance="22uH"
          footprint="1206"
          schX={-1.5}
          schY={1.8}
          schSectionName="auxiliary_supply"
          connections={{ pin1: "net.HOT_GND", pin2: "net.AUX_RAW" }}
        />
        <diode
          name="D8"
          footprint="sod123"
          schX={0.4}
          schY={1.8}
          schSectionName="auxiliary_supply"
          connections={{
            anode: "net.AUX_RAW",
            cathode: "net.VDD_PRIMARY",
          }}
        />

        <chip
          name="U1"
          footprint="soic8"
          schX={-4.5}
          schY={-0.8}
          schSectionName="primary_control"
          pinLabels={{
            pin1: "VDD",
            pin2: "GND",
            pin3: "ISENSE",
            pin4: "GATE",
          }}
          schPinArrangement={{
            leftSide: {
              direction: "top-to-bottom",
              pins: ["VDD", "GND", "ISENSE"],
            },
            rightSide: {
              direction: "top-to-bottom",
              pins: ["GATE"],
            },
          }}
          connections={{
            VDD: "net.VDD_PRIMARY",
            GND: "net.PRIMARY_GND",
            ISENSE: "net.CS",
            GATE: "net.PWM_MAIN",
          }}
        />
        <chip
          name="U2"
          footprint="soic8"
          schX={0}
          schY={-0.8}
          schSectionName="primary_control"
          pinLabels={{
            pin1: "VIN",
            pin2: "GND",
            pin3: "PWM",
            pin4: "CLAMP",
          }}
          schPinArrangement={{
            leftSide: {
              direction: "top-to-bottom",
              pins: ["VIN", "GND", "PWM"],
            },
            rightSide: {
              direction: "top-to-bottom",
              pins: ["CLAMP"],
            },
          }}
          connections={{
            VIN: "net.VDD_PRIMARY",
            GND: "net.PRIMARY_GND",
            PWM: "net.PWM_MAIN",
            CLAMP: "net.CLAMP_DRAIN",
          }}
        />
        <chip
          name="T1"
          footprint="soic8"
          schX={5}
          schY={-0.5}
          schSectionName="flyback_transformer"
          pinLabels={{
            pin1: "PRI_DOT",
            pin2: "PRI_RET",
            pin3: "SEC_DOT",
            pin4: "SEC_RET",
          }}
          schPinArrangement={{
            leftSide: {
              direction: "top-to-bottom",
              pins: ["PRI_DOT", "PRI_RET"],
            },
            rightSide: {
              direction: "top-to-bottom",
              pins: ["SEC_DOT", "SEC_RET"],
            },
          }}
          connections={{
            PRI_DOT: "net.HV_BUS",
            PRI_RET: "net.CLAMP_DRAIN",
            SEC_DOT: "net.SECONDARY_OUT",
            SEC_RET: "net.SECONDARY_GND",
          }}
        />
        <resistor
          name="R27"
          resistance="0"
          footprint="0603"
          schX={-3.5}
          schY={3}
          schSectionName="primary_control"
          connections={{ pin1: "net.PWM_MAIN", pin2: "net.CLAMP_DRAIN" }}
        />
        <capacitor
          name="C26"
          capacitance="1uF"
          footprint="0603"
          schX={-1.5}
          schY={3}
          schSectionName="auxiliary_supply"
          connections={{ pin1: "net.VDD_PRIMARY", pin2: "net.PRIMARY_GND" }}
        />
        <capacitor
          name="C27"
          capacitance="10uF"
          footprint="0805"
          schX={0.5}
          schY={3}
          schSectionName="auxiliary_supply"
          connections={{ pin1: "net.VDD_PRIMARY", pin2: "net.PRIMARY_GND" }}
        />
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  const acInputSheet = circuit.db.schematic_sheet.getWhere({
    name: "ac_input",
  })!
  const activeClampSheet = circuit.db.schematic_sheet.getWhere({
    name: "active_clamp",
  })!
  const schematicTraces = circuit.db.schematic_trace.list()
  const schematicTraceSheetIds = schematicTraces.map(
    (trace) => trace.schematic_sheet_id,
  )

  expect(schematicTraces.length).toBeGreaterThan(0)
  expect(schematicTraceSheetIds).not.toContain(undefined)
  expect(new Set(schematicTraceSheetIds)).toEqual(
    new Set([
      acInputSheet.schematic_sheet_id,
      activeClampSheet.schematic_sheet_id,
    ]),
  )

  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
})
