import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("two-point courtyard outlines report invalid props before placement checks", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <pcbnotetext text="Courtyard props diagnostics" pcbY={4} fontSize={0.3} />
      <pcbnotetext
        text="Courtyard validation message"
        pcbY={-3}
        fontSize={0.2}
      />
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              portHints={["1"]}
              pcbX={-1}
              pcbY={0}
              width={0.6}
              height={0.4}
              shape="rect"
            />
            <smtpad
              portHints={["2"]}
              pcbX={1}
              pcbY={0}
              width={0.6}
              height={0.4}
              shape="rect"
            />
            <courtyardoutline
              outline={[
                { x: -1.5, y: 0.5 },
                { x: 1.5, y: 0.5 },
              ]}
              layer="top"
            />
            <courtyardoutline
              outline={[
                { x: 1.5, y: 0.5 },
                { x: 1.5, y: -0.5 },
              ]}
              layer="top"
            />
            <courtyardoutline
              outline={[
                { x: 1.5, y: -0.5 },
                { x: -1.5, y: -0.5 },
              ]}
              layer="top"
            />
            <courtyardoutline
              outline={[
                { x: -1.5, y: -0.5 },
                { x: -1.5, y: 0.5 },
              ]}
              layer="top"
            />
          </footprint>
        }
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={3} />
      <trace from=".U1 > .pin2" to=".R1 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const errors = circuit.db.source_failed_to_create_component_error.list()
  const diagnosticsCountNote = circuit.db.pcb_note_text
    .list()
    .find((note) => note.text === "Courtyard props diagnostics")!
  const diagnosticsMessageNote = circuit.db.pcb_note_text
    .list()
    .find((note) => note.text === "Courtyard validation message")!
  circuit.db.pcb_note_text.update(diagnosticsCountNote.pcb_note_text_id, {
    text: `Two-point courtyard outlines / props errors: ${errors.length}`,
  })
  circuit.db.pcb_note_text.update(diagnosticsMessageNote.pcb_note_text_id, {
    text:
      errors[0]?.message.split(" Details:")[0] ?? "No props validation error",
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
    shouldDrawErrors: true,
  })
  expect(errors).toHaveLength(4)
  for (const error of errors) {
    expect(error.message).toContain("Invalid props for courtyardoutline")
    expect(error.message).toContain("outline")
    expect(error.message).toContain("at least 3")
  }
  expect(circuit.db.pcb_courtyard_outline.list()).toHaveLength(0)
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
})
