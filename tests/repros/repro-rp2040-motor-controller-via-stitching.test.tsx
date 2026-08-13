import { test } from "bun:test"
import { runRp2040MotorControllerViaStitchingRepro } from "tests/fixtures/via-stitching"

test(
  "repro: RP2040 motor controller stitches wide traces after autorouting",
  async () => runRp2040MotorControllerViaStitchingRepro(import.meta.path),
  1_800_000,
)
