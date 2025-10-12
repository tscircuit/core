import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbnoteline outside a footprint creates a global note line", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pcbnoteline
        x1={0}
        y1={0}
        x2={5}
        y2={0}
        strokeWidth={0.5}
        color="#ff00ff"
        isDashed
      />
    </board>,
  )

  circuit.render()

  const lines = circuit.db.pcb_note_line.list()
  expect(lines).toHaveLength(1)
  expect(lines[0]).toMatchObject({
    type: "pcb_note_line",
    x1: 0,
    y1: 0,
    x2: 5,
    y2: 0,
    stroke_width: 0.5,
    color: "#ff00ff",
    is_dashed: true,
  })
  expect(lines[0].pcb_component_id).toBeUndefined()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("pcbnoteline inside a footprint attaches to the parent component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint={
          <footprint>
            <pcbnoteline x1={-1} y1={0} x2={1} y2={0} />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const noteLines = circuit.db.pcb_note_line.list()
  expect(noteLines).toHaveLength(1)

  const pcbComponent = circuit.db.pcb_component.list()[0]
  expect(pcbComponent).toBeDefined()
  expect(noteLines[0].pcb_component_id).toBe(pcbComponent.pcb_component_id)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
