import { test } from "bun:test"
import { checkChipOrientationAirwires } from "tests/fixtures/chip-orientation-airwires"

test("chip airwire orientation at 270 degrees warns before bus lanes routing when materially worse", async () => {
  await checkChipOrientationAirwires(270, import.meta.path)
})
