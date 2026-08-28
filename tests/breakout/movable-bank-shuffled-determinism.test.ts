import { expect, test } from "bun:test"
import { planImplicitBreakoutBanks } from "lib/components/primitive-components/Breakout/plan-implicit-breakout-banks"
import { createMovableBankFixture } from "./fixtures/movable-bank-fixture"

test("movable bank output is independent of input collection order", () => {
  const buses = [
    { busId: "first", count: 4, layer: "inner1" },
    { busId: "second", count: 4, layer: "inner2" },
  ]
  expect(
    planImplicitBreakoutBanks(createMovableBankFixture({ buses })),
  ).toEqual(
    planImplicitBreakoutBanks(
      createMovableBankFixture({ buses, shuffle: true }),
    ),
  )
})
