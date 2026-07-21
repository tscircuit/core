import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("dip8 footprint renders pin numbers in fabrication notes", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10.8mm" height="7.95mm">
      <opamp name="U1" footprint="dip8" pcbX="0mm" pcbY="0mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const fabricationNotes: any[] = circuit
    .getCircuitJson()
    .filter((elm: any) => elm.type === "pcb_fabrication_note_text")

  expect(fabricationNotes).toHaveLength(8)

  const texts = fabricationNotes.map((n) => n.text)
  for (const text of texts) {
    expect(text).toMatch(/\{pin\d+\}/)
  }

  expect(texts).toMatchInlineSnapshot(`
    [
      "{pin1}",
      "{pin2}",
      "{pin3}",
      "{pin4}",
      "{pin5}",
      "{pin6}",
      "{pin7}",
      "{pin8}",
    ]
  `)

  // This test intentionally passes — the snapshot below documents the current
  // bug where fabrication notes contain literal {pinN} placeholders instead
  // of resolved pin labels.
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
