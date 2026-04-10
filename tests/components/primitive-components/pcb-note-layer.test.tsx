import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb_note elements pass layer prop to circuit json", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <pcbnoterect
        pcbX={-5}
        pcbY={3}
        width="4mm"
        height="2.5mm"
        strokeWidth={0.1}
        color="#00FFFF"
        layer="top"
      />
      <pcbnoterect
        pcbX={5}
        pcbY={3}
        width="4mm"
        height="2.5mm"
        strokeWidth={0.1}
        color="#FF0000"
        layer="bottom"
      />
      <pcbnotetext
        pcbX={0}
        pcbY={0}
        text="TOP NOTE"
        fontSize="1mm"
        color="#FFFFFF"
        layer="top"
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-2}
        text="BOTTOM NOTE"
        fontSize="1mm"
        color="#FFFFFF"
        layer="bottom"
      />
      <pcbnoteline
        x1={-3}
        y1={4}
        x2={3}
        y2={4}
        strokeWidth={0.15}
        color="#E67E22"
        layer="top"
      />
      <pcbnoteline
        x1={-3}
        y1={-4}
        x2={3}
        y2={-4}
        strokeWidth={0.15}
        color="#3498DB"
        layer="bottom"
      />
      <pcbnotepath
        route={[
          { x: -2, y: -2 },
          { x: 0, y: -4 },
          { x: 2, y: -2 },
        ]}
        strokeWidth={0.12}
        color="#9B59B6"
        layer="top"
      />
      <pcbnotepath
        route={[
          { x: -2, y: 2 },
          { x: 0, y: 4 },
          { x: 2, y: 2 },
        ]}
        strokeWidth={0.12}
        color="#2ECC71"
        layer="bottom"
      />
    </board>,
  )

  circuit.render()

  // Verify pcb_note_rect layer
  const noteRects = circuit.db.pcb_note_rect.list()
  expect(noteRects).toHaveLength(2)
  expect(noteRects.find((r) => r.color === "#00FFFF")?.layer).toBe("top")
  expect(noteRects.find((r) => r.color === "#FF0000")?.layer).toBe("bottom")

  // Verify pcb_note_text layer
  const noteTexts = circuit.db.pcb_note_text.list()
  expect(noteTexts).toHaveLength(2)
  expect(noteTexts.find((t) => t.text === "TOP NOTE")?.layer).toBe("top")
  expect(noteTexts.find((t) => t.text === "BOTTOM NOTE")?.layer).toBe("bottom")

  // Verify pcb_note_line layer
  const noteLines = circuit.db.pcb_note_line.list()
  expect(noteLines).toHaveLength(2)
  expect(noteLines.find((l) => l.color === "#E67E22")?.layer).toBe("top")
  expect(noteLines.find((l) => l.color === "#3498DB")?.layer).toBe("bottom")

  // Verify pcb_note_path layer
  const notePaths = circuit.db.pcb_note_path.list()
  expect(notePaths).toHaveLength(2)
  expect(notePaths.find((p) => p.color === "#9B59B6")?.layer).toBe("top")
  expect(notePaths.find((p) => p.color === "#2ECC71")?.layer).toBe("bottom")
})
