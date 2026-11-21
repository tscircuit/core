import { expect, test } from "bun:test"
import { cssSelectPrimitiveComponentAdapterWithoutSubcircuits } from "lib/components/base-components/PrimitiveComponent/cssSelectPrimitiveComponentAdapter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("automatic breakout points preserve indexed port lookups during the scan", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={16} schematicDisabled>
      <breakout name="B1" padding={1}>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-4}
          pcbY={3}
        />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={-4} />
        <resistor
          name="R3"
          resistance="1k"
          footprint="0402"
          pcbX={-4}
          pcbY={-3}
        />
      </breakout>
      <resistor name="R4" resistance="1k" footprint="0402" pcbX={4} pcbY={3} />
      <resistor name="R5" resistance="1k" footprint="0402" pcbX={4} />
      <resistor name="R6" resistance="1k" footprint="0402" pcbX={4} pcbY={-3} />
      <trace from="R1.pin2" to="R4.pin1" />
      <trace from="R2.pin2" to="R5.pin1" />
      <trace from="R3.pin2" to="R6.pin1" />
    </board>,
  )
  const adapter = cssSelectPrimitiveComponentAdapterWithoutSubcircuits!
  const getAttributeValue = adapter.getAttributeValue
  let aliasChecks = 0
  adapter.getAttributeValue = (node, name) => {
    if (name === "class") aliasChecks++
    return getAttributeValue(node, name)
  }
  try {
    await circuit.renderUntilSettled()
  } finally {
    adapter.getAttributeValue = getAttributeValue
  }
  expect(circuit.db.pcb_breakout_point.list()).toHaveLength(3)
  circuit.db.pcb_note_text.insert({
    text: `Class-alias checks: ${aliasChecks}`,
    anchor_position: { x: 0, y: 6.5 },
    anchor_alignment: "center",
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.6,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
    backgroundColor: "white",
    showSolderMask: false,
  })
})
