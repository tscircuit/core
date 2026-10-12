import { expect, test } from "bun:test"
import { createLedRotationRepro } from "tests/fixtures/jlc-led-silkscreen-rect-rotation/create-led-rotation-repro"

test("real JLC LED rectangles remain axis-aligned when their pads rotate 45deg", async () => {
  for (const layer of ["top", "bottom"] as const) {
    const circuit = createLedRotationRepro(layer)
    // A malformed import must not produce a misleading empty snapshot.
    expect(
      circuit.getCircuitJson().filter((e) => e.type.endsWith("_error")),
    ).toEqual([])
    await expect(circuit).toMatchPcbSnapshot(
      import.meta.path.replace(".test.tsx", `-${layer}`),
      { layer, width: 1400, height: 1200, showFabricationNotes: false },
    )
  }
})
