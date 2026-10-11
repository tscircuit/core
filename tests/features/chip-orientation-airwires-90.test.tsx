import { test } from "bun:test"
import { checkChipOrientationAirwires } from "tests/fixtures/chip-orientation-airwires"

test("chip airwire orientation at 90 degrees warns before bus lanes routing when materially worse", async () => {
  await checkChipOrientationAirwires(90, import.meta.path)
})
