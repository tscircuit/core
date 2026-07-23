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

test("pcbStyle.silkscreenTextVisibility on component hides only that component's designator", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <resistor
        name="R1"
        resistance="330"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
        pcbStyle={{ silkscreenTextVisibility: "hidden" }}
      />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={0} />
    </board>,
  )

  circuit.render()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  // R1 designator hidden, R2 designator visible
  expect(silkscreenTexts.map((t) => t.text)).toEqual(["R2"])
})

test("pcbStyle.silkscreenTextPosition offsets footprint designator text", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <resistor
        name="R1"
        resistance="330"
        footprint="0402"
        pcbX={0}
        pcbY={0}
        pcbStyle={{
          silkscreenTextPosition: { offsetX: 2, offsetY: 3 },
        }}
      />
    </board>,
  )

  circuit.render()

  const text = circuit.db.pcb_silkscreen_text.getWhere({ text: "R1" })
  expect(text).toBeDefined()
  expect(text?.anchor_position.x).toBe(2)
  expect(text?.anchor_position.y).toBe(3)
})

test("pcbStyle.silkscreenTextPosition 'none' hides footprint designator text", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <resistor
        name="R1"
        resistance="330"
        footprint="0402"
        pcbX={0}
        pcbY={0}
        pcbStyle={{
          silkscreenTextPosition: "none",
        }}
      />
    </board>,
  )

  circuit.render()

  const text = circuit.db.pcb_silkscreen_text.getWhere({ text: "R1" })
  expect(text).toBeUndefined()
})
