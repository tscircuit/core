import { expect, test } from "bun:test"
import {
  createLedRotationRepro,
  getLedRectangleRotationMismatches,
} from "tests/fixtures/jlc-led-silkscreen-rect-rotation/create-led-rotation-repro"

// Expected to fail until SilkscreenRect preserves arbitrary parent rotation.
// Strict mode exposes the ordinary red test and readable per-part diagnostics.
const checkRotation =
  process.env.TSCIRCUIT_REPRO_STRICT === "1" ? test : test.failing

checkRotation(
  "JLC LED silkscreen rectangle axes must follow emitted pad axes",
  () => {
    const mismatches = (["top", "bottom"] as const).flatMap((layer) =>
      getLedRectangleRotationMismatches(createLedRotationRepro(layer), layer),
    )
    expect(mismatches).toEqual([])
  },
)
