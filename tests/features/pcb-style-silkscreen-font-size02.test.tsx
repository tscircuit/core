import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("pcbStyle silkscreen font size applies to footprinter text for 0402/0603", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="15mm" pcbStyle={{ silkscreenFontSize: "5mm" }}>
      <resistor name="R1" resistance="330" footprint="0402" pcbX={0} pcbY={0} />
      <led name="D1" color="red" footprint="0603" pcbX={6} pcbY={0} />
      <trace from=".R1 > .pin2" to=".D1 > .anode" />
    </board>,
  )

  circuit.render()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  const resistorLabel = silkscreenTexts.find((text) => text.text === "R1")
  const ledLabel = silkscreenTexts.find((text) => text.text === "D1")

  expect(resistorLabel?.font_size).toBe(5)
  expect(ledLabel?.font_size).toBe(5)
})
