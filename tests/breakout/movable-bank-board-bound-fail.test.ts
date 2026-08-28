import { expect, test } from "bun:test"
import {
  ImplicitBreakoutBankInfeasibleError,
  planImplicitBreakoutBanks,
} from "lib/components/primitive-components/Breakout/plan-implicit-breakout-banks"
import { createMovableBankFixture } from "./fixtures/movable-bank-fixture"

test("movable bank fails deterministically when board bounds cannot fit minimum pitch", () => {
  const fixture = createMovableBankFixture({
    buses: [{ busId: "data", count: 5, layer: "inner2" }],
    boardBounds: { minX: -1.5, maxX: 1.5, minY: -1.5, maxY: 1.5 },
  })
  expect(() => planImplicitBreakoutBanks(fixture)).toThrow(
    ImplicitBreakoutBankInfeasibleError,
  )
})
