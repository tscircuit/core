import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const dualNmosPinLabels = {
  pin1: ["S1"],
  pin2: ["G1"],
  pin3: ["S2"],
  pin4: ["G2"],
  pin5: ["D21"],
  pin6: ["D22"],
  pin7: ["D11"],
  pin8: ["D12"],
} as const

const drv8711PinLabels = {
  pin1: ["CP1"],
  pin2: ["CP2"],
  pin3: ["VCP"],
  pin4: ["VM"],
  pin5: ["GND1"],
  pin6: ["V5"],
  pin7: ["VINT"],
  pin8: ["SLEEPN"],
  pin9: ["RESET"],
  pin10: ["STEP_AIN1"],
  pin11: ["DIR_AIN2"],
  pin12: ["BIN1"],
  pin13: ["BIN2"],
  pin14: ["SCLK"],
  pin15: ["SDATI"],
  pin16: ["SCS"],
  pin17: ["SDATO"],
  pin18: ["FAULTN"],
  pin19: ["STALLN_BEMFV"],
  pin20: ["BEMF"],
  pin21: ["BOUT2"],
  pin22: ["B2HS"],
  pin23: ["B2LS"],
  pin24: ["BISENN"],
  pin25: ["BISENP"],
  pin26: ["B1LS"],
  pin27: ["B1HS"],
  pin28: ["BOUT1"],
  pin29: ["GND3"],
  pin30: ["AOUT2"],
  pin31: ["A2HS"],
  pin32: ["A2LS"],
  pin33: ["AISENN"],
  pin34: ["AISENP"],
  pin35: ["A1LS"],
  pin36: ["A1HS"],
  pin37: ["AOUT1"],
  pin38: ["GND2"],
  pin39: ["EP"],
} as const

/**
 * Schematic-only reproduction of the BOOST-DRV8711 power-stage sheet.
 *
 * The four dual MOSFETs are on "Power stage", while their eight gate-drive
 * endpoints are on U1 on "Controller and interface". Core therefore inserts
 * fallback net labels for those direct cross-sheet traces. The second sheet is
 * intentionally retained because a single-sheet fixture does not exercise the
 * cross-sheet fallback labels.
 */
test("BOOST-DRV8711 power stage avoids cross-sheet net-label overlap", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board routingDisabled>
      <schematicsheet
        name="Power stage"
        displayName="Power stage"
        sheetIndex={1}
      />
      <schematicsheet
        name="Controller and interface"
        displayName="Controller and interface"
        sheetIndex={2}
      />

      <chip
        name="U1"
        manufacturerPartNumber="DRV8711DCPR"
        pinLabels={drv8711PinLabels}
        schPinArrangement={{
          leftSide: {
            pins: [
              "CP1",
              "CP2",
              "VCP",
              "VM",
              "V5",
              "VINT",
              "SLEEPN",
              "RESET",
              "STEP_AIN1",
              "DIR_AIN2",
              "BIN1",
              "BIN2",
              "SCLK",
              "SDATI",
              "SCS",
              "SDATO",
              "FAULTN",
              "STALLN_BEMFV",
            ],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: [
              "AOUT1",
              "A1HS",
              "A1LS",
              "AISENP",
              "AISENN",
              "A2LS",
              "A2HS",
              "AOUT2",
              "BOUT1",
              "B1HS",
              "B1LS",
              "BISENP",
              "BISENN",
              "B2LS",
              "B2HS",
              "BOUT2",
              "BEMF",
              "GND1",
              "GND2",
              "GND3",
              "EP",
            ],
            direction: "top-to-bottom",
          },
        }}
        schX={0}
        schY={0}
        schWidth="5mm"
        schHeight="9mm"
        schSheetName="Controller and interface"
      />

      <chip
        name="Q1"
        manufacturerPartNumber="CSD88537ND"
        pinLabels={dualNmosPinLabels}
        schPinArrangement={{
          leftSide: {
            pins: ["S1", "G1", "S2", "G2"],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: ["D12", "D11", "D22", "D21"],
            direction: "top-to-bottom",
          },
        }}
        schX={-8.1}
        schY={3}
        schWidth="1.8mm"
        schHeight="1.8mm"
        schSheetName="Power stage"
      />
      <chip
        name="Q2"
        manufacturerPartNumber="CSD88537ND"
        pinLabels={dualNmosPinLabels}
        schPinArrangement={{
          leftSide: {
            pins: ["S1", "G1", "S2", "G2"],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: ["D12", "D11", "D22", "D21"],
            direction: "top-to-bottom",
          },
        }}
        schX={-2.7}
        schY={3}
        schWidth="1.8mm"
        schHeight="1.8mm"
        schSheetName="Power stage"
      />
      <chip
        name="Q3"
        manufacturerPartNumber="CSD88537ND"
        pinLabels={dualNmosPinLabels}
        schPinArrangement={{
          leftSide: {
            pins: ["S1", "G1", "S2", "G2"],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: ["D12", "D11", "D22", "D21"],
            direction: "top-to-bottom",
          },
        }}
        schX={2.7}
        schY={3}
        schWidth="1.8mm"
        schHeight="1.8mm"
        schSheetName="Power stage"
      />
      <chip
        name="Q4"
        manufacturerPartNumber="CSD88537ND"
        pinLabels={dualNmosPinLabels}
        schPinArrangement={{
          leftSide: {
            pins: ["S1", "G1", "S2", "G2"],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: ["D12", "D11", "D22", "D21"],
            direction: "top-to-bottom",
          },
        }}
        schX={8.1}
        schY={3}
        schWidth="1.8mm"
        schHeight="1.8mm"
        schSheetName="Power stage"
      />

      <chip
        name="J5"
        pinLabels={{ pin1: "GND", pin2: "VM" }}
        schPinArrangement={{
          leftSide: { pins: ["GND"], direction: "top-to-bottom" },
          rightSide: { pins: ["VM"], direction: "top-to-bottom" },
        }}
        schX={-7}
        schY={-3}
        schSheetName="Power stage"
      />
      <chip
        name="J6"
        pinLabels={{
          pin1: "BOUT2",
          pin2: "BOUT1",
          pin3: "AOUT2",
          pin4: "AOUT1",
        }}
        schPinArrangement={{
          leftSide: {
            pins: ["BOUT2", "BOUT1"],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: ["AOUT2", "AOUT1"],
            direction: "top-to-bottom",
          },
        }}
        schX={0}
        schY={5.5}
        schWidth="3mm"
        schSheetName="Power stage"
      />

      <capacitor
        name="C1"
        capacitance="100uF"
        schX={-4.5}
        schY={-3}
        schSheetName="Power stage"
      />
      <capacitor
        name="C2"
        capacitance="10nF"
        schX={-1.5}
        schY={-3}
        schOrientation="vertical"
        schSheetName="Power stage"
      />
      <capacitor
        name="C8"
        capacitance="1uF"
        schX={1.5}
        schY={-3}
        schOrientation="vertical"
        schSheetName="Power stage"
      />

      <resistor
        name="R1"
        resistance="0.05"
        schX={-2.5}
        schY={0}
        schRotation={90}
        schSheetName="Power stage"
      />
      <resistor
        name="R2"
        resistance="0.05"
        schX={2.5}
        schY={0}
        schRotation={90}
        schSheetName="Power stage"
      />

      <jumper name="NT1" schX={-5} schY={0} schSheetName="Power stage" />
      <jumper name="NT2" schX={5} schY={0} schSheetName="Power stage" />
      <jumper name="NT3" schX={-7.5} schY={0} schSheetName="Power stage" />
      <jumper name="NT4" schX={7.5} schY={0} schSheetName="Power stage" />

      <trace from=".J5 > .pin2" to="net.VM" schDisplayLabel="VM" />
      <trace from=".C1 > .pin1" to="net.VM" schDisplayLabel="VM" />
      <trace from=".C2 > .pin1" to="net.VM" schDisplayLabel="VM" />
      <trace from=".C8 > .pin1" to="net.VM" schDisplayLabel="VM" />
      <trace from=".U1 > .VM" to="net.VM" schDisplayLabel="VM" />
      <trace from=".Q1 > .D11" to="net.VM" schDisplayLabel="VM" />
      <trace from=".Q1 > .D12" to="net.VM" schDisplayLabel="VM" />
      <trace from=".Q2 > .D21" to="net.VM" schDisplayLabel="VM" />
      <trace from=".Q2 > .D22" to="net.VM" schDisplayLabel="VM" />
      <trace from=".Q3 > .D11" to="net.VM" schDisplayLabel="VM" />
      <trace from=".Q3 > .D12" to="net.VM" schDisplayLabel="VM" />
      <trace from=".Q4 > .D21" to="net.VM" schDisplayLabel="VM" />
      <trace from=".Q4 > .D22" to="net.VM" schDisplayLabel="VM" />

      <trace from=".J5 > .pin1" to="net.GND" schDisplayLabel="GND" />
      <trace from=".C1 > .pin2" to="net.GND" schDisplayLabel="GND" />
      <trace from=".C2 > .pin2" to="net.GND" schDisplayLabel="GND" />
      <trace from=".C8 > .pin2" to="net.GND" schDisplayLabel="GND" />
      <trace from=".U1 > .GND1" to="net.GND" schDisplayLabel="GND" />
      <trace from=".U1 > .GND2" to="net.GND" schDisplayLabel="GND" />
      <trace from=".U1 > .GND3" to="net.GND" schDisplayLabel="GND" />
      <trace from=".U1 > .EP" to="net.GND" schDisplayLabel="GND" />
      <trace from=".R1 > .pin1" to="net.GND" schDisplayLabel="GND" />
      <trace from=".NT3 > .pin2" to="net.GND" schDisplayLabel="GND" />
      <trace from=".R2 > .pin1" to="net.GND" schDisplayLabel="GND" />
      <trace from=".NT4 > .pin2" to="net.GND" schDisplayLabel="GND" />

      <trace from=".Q1 > .S1" to="net.AOUT1" schDisplayLabel="AOUT1" />
      <trace from=".Q1 > .D21" to="net.AOUT1" schDisplayLabel="AOUT1" />
      <trace from=".Q1 > .D22" to="net.AOUT1" schDisplayLabel="AOUT1" />
      <trace from=".U1 > .AOUT1" to="net.AOUT1" schDisplayLabel="AOUT1" />
      <trace from=".J6 > .pin4" to="net.AOUT1" schDisplayLabel="AOUT1" />

      <trace from=".Q2 > .S2" to="net.AOUT2" schDisplayLabel="AOUT2" />
      <trace from=".Q2 > .D11" to="net.AOUT2" schDisplayLabel="AOUT2" />
      <trace from=".Q2 > .D12" to="net.AOUT2" schDisplayLabel="AOUT2" />
      <trace from=".U1 > .AOUT2" to="net.AOUT2" schDisplayLabel="AOUT2" />
      <trace from=".J6 > .pin3" to="net.AOUT2" schDisplayLabel="AOUT2" />

      <trace from=".Q3 > .S1" to="net.BOUT1" schDisplayLabel="BOUT1" />
      <trace from=".Q3 > .D21" to="net.BOUT1" schDisplayLabel="BOUT1" />
      <trace from=".Q3 > .D22" to="net.BOUT1" schDisplayLabel="BOUT1" />
      <trace from=".U1 > .BOUT1" to="net.BOUT1" schDisplayLabel="BOUT1" />
      <trace from=".J6 > .pin2" to="net.BOUT1" schDisplayLabel="BOUT1" />

      <trace from=".Q4 > .S2" to="net.BOUT2" schDisplayLabel="BOUT2" />
      <trace from=".Q4 > .D11" to="net.BOUT2" schDisplayLabel="BOUT2" />
      <trace from=".Q4 > .D12" to="net.BOUT2" schDisplayLabel="BOUT2" />
      <trace from=".U1 > .BOUT2" to="net.BOUT2" schDisplayLabel="BOUT2" />
      <trace from=".J6 > .pin1" to="net.BOUT2" schDisplayLabel="BOUT2" />

      <trace from=".Q1 > .S2" to="net.GND_A" schDisplayLabel="GND_A" />
      <trace from=".R1 > .pin2" to="net.GND_A" schDisplayLabel="GND_A" />
      <trace from=".NT1 > .pin2" to="net.GND_A" schDisplayLabel="GND_A" />
      <trace from=".Q2 > .S1" to="net.GND_A" schDisplayLabel="GND_A" />

      <trace from=".Q3 > .S2" to="net.GND_B" schDisplayLabel="GND_B" />
      <trace from=".R2 > .pin2" to="net.GND_B" schDisplayLabel="GND_B" />
      <trace from=".NT2 > .pin2" to="net.GND_B" schDisplayLabel="GND_B" />
      <trace from=".Q4 > .S1" to="net.GND_B" schDisplayLabel="GND_B" />

      <trace from=".U1 > .A1HS" to=".Q1 > .G1" />
      <trace from=".U1 > .A1LS" to=".Q1 > .G2" />
      <trace from=".U1 > .A2LS" to=".Q2 > .G1" />
      <trace from=".U1 > .A2HS" to=".Q2 > .G2" />
      <trace from=".U1 > .B1HS" to=".Q3 > .G1" />
      <trace from=".U1 > .B1LS" to=".Q3 > .G2" />
      <trace from=".U1 > .B2LS" to=".Q4 > .G1" />
      <trace from=".U1 > .B2HS" to=".Q4 > .G2" />

      <trace from=".U1 > .AISENP" to="net.AISENP" schDisplayLabel="AISENP" />
      <trace from=".NT1 > .pin1" to="net.AISENP" schDisplayLabel="AISENP" />
      <trace from=".U1 > .AISENN" to="net.AISENN" schDisplayLabel="AISENN" />
      <trace from=".NT3 > .pin1" to="net.AISENN" schDisplayLabel="AISENN" />
      <trace from=".U1 > .BISENP" to="net.BISENP" schDisplayLabel="BISENP" />
      <trace from=".NT2 > .pin1" to="net.BISENP" schDisplayLabel="BISENP" />
      <trace from=".U1 > .BISENN" to="net.BISENN" schDisplayLabel="BISENN" />
      <trace from=".NT4 > .pin1" to="net.BISENN" schDisplayLabel="BISENN" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const powerStageSheet = circuit.db.schematic_sheet.getWhere({
    name: "Power stage",
  })!
  const crossSheetGateDriveLabels = circuit.db.schematic_net_label
    .list()
    .filter(
      (netLabel) =>
        netLabel.schematic_sheet_id === powerStageSheet.schematic_sheet_id &&
        /^U1_[AB][12][HL]S$/.test(netLabel.text),
    )
    .map((netLabel) => netLabel.text)
    .sort()

  expect(crossSheetGateDriveLabels).toEqual([
    "U1_A1HS",
    "U1_A1LS",
    "U1_A2HS",
    "U1_A2LS",
    "U1_B1HS",
    "U1_B1LS",
    "U1_B2HS",
    "U1_B2LS",
  ])
  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
}, 120_000)
