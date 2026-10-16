import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("test points need no courtyard while ordinary components still warn", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={36} height={18} schematicDisabled>
      <pcbnotetext
        text="NO COURTYARDS: ONLY R1 SHOULD WARN"
        pcbY={7}
        fontSize={1}
      />
      <testpoint
        name="TP1"
        footprintVariant="pad"
        padShape="circle"
        pcbX={-11}
        pcbY={1}
      />
      <testpoint
        name="TP2"
        footprintVariant="through_hole"
        holeDiameter={0.6}
        pcbX={0}
        pcbY={1}
      />
      <resistor
        name="R1"
        resistance="10k"
        pcbX={11}
        pcbY={1}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              shape="rect"
              width={0.8}
              height={1.2}
              pcbX={-1}
            />
            <smtpad
              portHints={["pin2"]}
              shape="rect"
              width={0.8}
              height={1.2}
              pcbX={1}
            />
          </footprint>
        }
      />
      <pcbnotetext text="TP1: SMT PAD" pcbX={-11} pcbY={4} fontSize={0.8} />
      <pcbnotetext text="TP2: THROUGH HOLE" pcbY={4} fontSize={0.8} />
      <pcbnotetext text="R1: RESISTOR" pcbX={11} pcbY={4} fontSize={0.8} />
      <pcbnotetext text="NO WARNING" pcbX={-11} pcbY={-3} fontSize={0.8} />
      <pcbnotetext text="NO WARNING" pcbY={-3} fontSize={0.8} />
      <pcbnotetext text="WARNING EXPECTED" pcbX={11} pcbY={-3} fontSize={0.8} />
      <pcbnotetext
        text="Test points are exempt; ordinary components still need courtyards."
        pcbY={-6.5}
        fontSize={0.7}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const warnings = circuit.db.pcb_component_missing_courtyard_warning.list()
  expect(warnings).toMatchObject([{ message: "R1 has no courtyard" }])

  // The PCB renderer does not draw missing-courtyard warnings, so display the
  // actual diagnostic messages as a note in the snapshot.
  const circuitJson = circuit.getCircuitJson()
  circuitJson.push({
    type: "pcb_note_text",
    pcb_note_text_id: "pcb_note_text_courtyard_diagnostics",
    text: `Reported courtyard warnings: ${warnings.map((warning) => warning.message).join("; ")}`,
    anchor_position: { x: 0, y: -4.7 },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: 0.7,
    layer: "top",
    color: "#ffa500",
  })

  await expect(circuitJson).toMatchPcbSnapshot(import.meta.path, {
    width: 1200,
    height: 650,
    shouldDrawErrors: true,
    showCourtyards: true,
  })
})
