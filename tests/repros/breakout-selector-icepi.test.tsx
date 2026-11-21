import { expect, test } from "bun:test"
import { cssSelectPrimitiveComponentAdapterWithoutSubcircuits } from "lib/components/base-components/PrimitiveComponent/cssSelectPrimitiveComponentAdapter"
import IcePi from "tests/fixtures/icepi/board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("the real iCEPi board avoids repeated breakout selector scans", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<IcePi geometryOnly />)
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
  circuit.db.pcb_note_text.insert({
    text: `Class-alias checks: ${aliasChecks.toLocaleString("en-US")}`,
    anchor_position: { x: 0, y: 32 },
    anchor_alignment: "center",
    layer: "top",
    font: "tscircuit2024",
    font_size: 1,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1500,
    height: 1100,
    showPcbNotes: true,
    backgroundColor: "white",
    showSolderMask: false,
    showDebugObjects: false,
    shouldDrawRatsNest: false,
    viewport: { minX: -45, maxX: 45, minY: -30, maxY: 35 },
  })
})
