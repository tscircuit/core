import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin1: ["A1"],
  pin2: ["A2"],
  pin3: ["SHIELD1"],
  pin4: ["SHIELD2"],
} as const

const PillPlug = (props: {
  name: string
  pcbX: number
  pcbRotation?: number
}) => (
  <chip
    {...props}
    pinLabels={pinLabels}
    footprint={
      <footprint>
        <platedhole
          portHints={["pin1"]}
          shape="circle"
          holeDiameter="1mm"
          outerDiameter="1.8mm"
          pcbX="-3mm"
          pcbY="-2mm"
        />
        <platedhole
          portHints={["pin2"]}
          shape="circle"
          holeDiameter="1mm"
          outerDiameter="1.8mm"
          pcbX="-3mm"
          pcbY="2mm"
        />
        <platedhole
          portHints={["pin3"]}
          shape="pill"
          rectPad
          holeWidth="2mm"
          holeHeight="0.8mm"
          outerWidth="2.8mm"
          outerHeight="1.6mm"
          pcbX="3mm"
          pcbY="-2mm"
        />
        <platedhole
          portHints={["pin4"]}
          shape="pill"
          rectPad
          holeWidth="2mm"
          holeHeight="0.8mm"
          outerWidth="2.8mm"
          outerHeight="1.6mm"
          pcbX="3mm"
          pcbY="2mm"
        />
      </footprint>
    }
  />
)

test("pill holes with rectangular pads retain their ports when rotated", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="18mm" schematicDisabled>
      <PillPlug name="P_REF" pcbX={-8} />
      <PillPlug name="P_ROT" pcbX={8} pcbRotation={90} />

      <net name="N1" />
      <net name="N2" />
      <net name="N3" />
      <net name="N4" />

      <trace from="P_REF.pin1" to="net.N1" />
      <trace from="P_ROT.pin1" to="net.N1" />
      <trace from="P_REF.pin2" to="net.N2" />
      <trace from="P_ROT.pin2" to="net.N2" />
      <trace from="P_REF.pin3" to="net.N3" />
      <trace from="P_ROT.pin3" to="net.N3" />
      <trace from="P_REF.pin4" to="net.N4" />
      <trace from="P_ROT.pin4" to="net.N4" />

      <pcbnotetext
        text="EXPECTED: FOUR ROUTED NETS BETWEEN MATCHING PINS"
        pcbY={7}
        fontSize={0.55}
      />
      <pcbnotetext text="UNROTATED" pcbX={-8} pcbY={-6} fontSize={0.5} />
      <pcbnotetext text="ROTATED 90deg" pcbX={8} pcbY={-6} fontSize={0.5} />
      <pcbnotetext
        text={'TRIGGER: shape="pill" + rectPad'}
        pcbY={-7.2}
        fontSize={0.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const routedTraceCount = circuit.db.pcb_trace.list().length
  const autoroutingErrors = circuit.db.pcb_autorouting_error.list()
  circuit.db.pcb_note_text.insert({
    font: "tscircuit2024",
    font_size: 0.55,
    text: `ACTUAL: ${routedTraceCount} ROUTES; ${autoroutingErrors.length} AUTOROUTING ERROR`,
    anchor_position: { x: 0, y: 6 },
    anchor_alignment: "center",
    layer: "top",
    color: "#ff6b6b",
  })

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  expect(autoroutingErrors).toHaveLength(0)
  expect(routedTraceCount).toBe(4)
})
