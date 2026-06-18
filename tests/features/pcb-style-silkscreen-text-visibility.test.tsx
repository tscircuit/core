import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("pcbStyle.silkscreenTextVisibility hides footprinter-generated designators", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="15mm"
      pcbStyle={{ silkscreenTextVisibility: "hidden" }}
    >
      <resistor name="R1" resistance="330" footprint="0402" pcbX={0} pcbY={0} />
      <led name="D1" color="red" footprint="0603" pcbX={6} pcbY={0} />
    </board>,
  )

  circuit.render()

  expect(circuit.db.pcb_silkscreen_text.list()).toHaveLength(0)
  expect(circuit.db.pcb_smtpad.list().length).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
