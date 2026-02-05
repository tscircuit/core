import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("pcbSx silkscreentext fontSize applies to footprinter-generated silkscreen text", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="15mm"
      pcbSx={{ "& silkscreentext": { fontSize: "3mm" } }}
    >
      <resistor name="R1" resistance="330" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  const resistorLabel = silkscreenTexts.find((text) => text.text === "R1")

  expect(resistorLabel?.font_size).toBe(3)
})
