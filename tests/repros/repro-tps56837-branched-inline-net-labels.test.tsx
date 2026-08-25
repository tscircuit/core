import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin1: ["EN"],
  pin2: ["FB"],
  pin3: ["AGND"],
  pin4: ["PG"],
  pin5: ["SS"],
  pin6: ["SW"],
  pin7: ["BOOT"],
  pin8: ["VIN"],
  pin9: ["PGND"],
  pin10: ["MODE"],
} as const

const chipPinArrangement = {
  leftSide: { pins: [8, 1, 5], direction: "top-to-bottom" as const },
  rightSide: { pins: [7, 6, 4, 2], direction: "top-to-bottom" as const },
  bottomSide: { pins: [10, 3, 9], direction: "left-to-right" as const },
}

test("named branches in a manually placed TPS56837 schematic", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled schMaxTraceDistance="100mm">
      <connector
        name="J1"
        pinLabels={{ pin1: ["VIN"], pin2: ["PGND"] }}
        schPinArrangement={{ rightSide: [1, 2] }}
        schX={-10.5}
        schY={2}
      />
      <capacitor
        name="C1"
        capacitance="10uF"
        schX={-9}
        schY={2}
        schOrientation="vertical"
      />
      <capacitor
        name="C2"
        capacitance="10uF"
        schX={-7.7}
        schY={2}
        schOrientation="vertical"
      />
      <capacitor
        name="C3"
        capacitance="0.1uF"
        schX={-6.4}
        schY={2}
        schOrientation="vertical"
      />
      <resistor
        name="R1"
        resistance="169k"
        schX={-5}
        schY={1.8}
        schOrientation="vertical"
      />
      <resistor
        name="R2"
        resistance="36.1k"
        schX={-5}
        schY={-1.1}
        schOrientation="vertical"
      />
      <capacitor
        name="C11"
        capacitance="47nF"
        schX={-3.8}
        schY={-1.2}
        schOrientation="vertical"
      />
      <resistor
        name="R3"
        resistance="30.1k"
        schX={-2.7}
        schY={-2.3}
        schOrientation="vertical"
      />

      <chip
        name="U1"
        manufacturerPartNumber="TPS56837RPAR"
        pinLabels={pinLabels}
        schPinArrangement={chipPinArrangement}
        schWidth={2.6}
        schHeight={2.8}
        schX={-0.5}
        schY={1}
      />

      <resistor name="R4" resistance="0" schX={3.1} schY={4} />
      <capacitor name="C4" capacitance="0.1uF" schX={4.7} schY={4} />
      <inductor name="L1" inductance="3.3uH" schX={6.7} schY={4} />
      <resistor name="R9" resistance="100k" schX={3.4} schY={1.1} />
      <resistor
        name="R5"
        resistance="49.9"
        schX={9.2}
        schY={2.2}
        schOrientation="vertical"
      />
      <resistor
        name="R6"
        resistance="73.2k"
        schX={9.2}
        schY={0.2}
        schOrientation="vertical"
      />
      <resistor name="R8" resistance="0" schX={7.2} schY={1.2} />
      <capacitor
        name="C10"
        capacitance="150pF"
        schX={6}
        schY={-0.1}
        schOrientation="vertical"
      />
      <resistor
        name="R7"
        resistance="10k"
        schX={6}
        schY={-2.1}
        schOrientation="vertical"
      />

      <capacitor
        name="C5"
        capacitance="22uF"
        schX={9.9}
        schY={2.3}
        schOrientation="vertical"
      />
      <capacitor
        name="C6"
        capacitance="22uF"
        schX={10.9}
        schY={2.3}
        schOrientation="vertical"
      />
      <capacitor
        name="C7"
        displayName="C7 DNP"
        capacitance="22uF"
        schX={11.9}
        schY={2.3}
        schOrientation="vertical"
      />
      <capacitor
        name="C8"
        displayName="C8 DNP"
        capacitance="22uF"
        schX={12.9}
        schY={2.3}
        schOrientation="vertical"
      />
      <capacitor
        name="C9"
        displayName="C9 DNP"
        capacitance="22uF"
        schX={13.9}
        schY={2.3}
        schOrientation="vertical"
      />
      <connector
        name="J2"
        pinLabels={{ pin1: ["VOUT"], pin2: ["PGND"] }}
        schPinArrangement={{ leftSide: [1, 2] }}
        schX={16}
        schY={2.3}
      />
      <schematictext
        text="TPS56837 5 V, 8 A Reference Design"
        schX={3.5}
        schY={-4.2}
        fontSize={0.35}
      />

      <trace from=".J1 > .VIN" to="net.VIN" />
      <trace from=".C1 > .pin1" to="net.VIN" />
      <trace from=".C2 > .pin1" to="net.VIN" />
      <trace from=".C3 > .pin1" to="net.VIN" />
      <trace from=".R1 > .pin1" to="net.VIN" />
      <trace from=".U1 > .VIN" to="net.VIN" />
      <trace from=".J1 > .PGND" to="net.PGND" />
      <trace from=".C1 > .pin2" to="net.PGND" />
      <trace from=".C2 > .pin2" to="net.PGND" />
      <trace from=".C3 > .pin2" to="net.PGND" />
      <trace from=".U1 > .PGND" to="net.PGND" />
      <trace from=".C5 > .pin2" to="net.PGND" />
      <trace from=".C6 > .pin2" to="net.PGND" />
      <trace from=".C7 > .pin2" to="net.PGND" />
      <trace from=".C8 > .pin2" to="net.PGND" />
      <trace from=".C9 > .pin2" to="net.PGND" />
      <trace from=".J2 > .PGND" to="net.PGND" />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <trace name="U1_EN" from=".R2 > .pin1" to=".U1 > .EN" />
      <trace from=".R2 > .pin2" to="net.AGND" />
      <trace from=".C11 > .pin2" to="net.AGND" />
      <trace from=".R3 > .pin2" to="net.AGND" />
      <trace from=".U1 > .AGND" to="net.AGND" />
      <trace from=".R7 > .pin2" to="net.AGND" />
      <trace from=".U1 > .SS" to=".C11 > .pin1" />
      <trace from=".U1 > .MODE" to=".R3 > .pin1" />
      <trace from=".U1 > .BOOT" to=".R4 > .pin1" />
      <trace from=".R4 > .pin2" to=".C4 > .pin1" />
      <trace from=".C4 > .pin2" to=".U1 > .SW" />
      <trace name="U1_SW" from=".U1 > .SW" to=".L1 > .pin1" />
      <trace from=".L1 > .pin2" to="net.VOUT" />
      <trace from=".U1 > .PG" to=".R9 > .pin1" />
      <trace from=".R9 > .pin2" to="net.VCC" />
      <trace from=".R5 > .pin1" to="net.VOUT" />
      <trace from=".R5 > .pin2" to=".R6 > .pin1" />
      <trace from=".R5 > .pin2" to=".R8 > .pin2" />
      <trace from=".R8 > .pin1" to=".C10 > .pin1" />
      <trace name="U1_FB" from=".R6 > .pin2" to=".U1 > .FB" />
      <trace from=".C10 > .pin2" to=".U1 > .FB" />
      <trace from=".R7 > .pin1" to=".U1 > .FB" />
      <trace from=".C5 > .pin1" to="net.VOUT" />
      <trace from=".C6 > .pin1" to="net.VOUT" />
      <trace from=".C7 > .pin1" to="net.VOUT" />
      <trace from=".C8 > .pin1" to="net.VOUT" />
      <trace from=".C9 > .pin1" to="net.VOUT" />
      <trace from=".J2 > .VOUT" to="net.VOUT" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const namedBranches = ["U1_EN", "U1_FB", "U1_SW"]
  const anchoredLabelTexts = circuit.db.schematic_net_label
    .list()
    .map((label) => label.text)
    .filter((text) => namedBranches.includes(text))
    .sort()
  const inlineLabelTexts = circuit.db.schematic_text
    .list()
    .filter((text) => text.source_trace_id)
    .map((text) => text.text)

  const renderedNamedBranchTexts = [
    ...anchoredLabelTexts,
    ...inlineLabelTexts,
  ].sort()
  expect(renderedNamedBranchTexts).toEqual(namedBranches)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
