import { expect, test } from "bun:test"
import { orderedRenderPhases } from "lib/components/base-components/Renderable"

test("orders differential-pair post-processing before copper pours and PCB DRC", () => {
  const routeNetIslandsPhaseIndex =
    orderedRenderPhases.indexOf("PcbRouteNetIslands")

  expect(
    orderedRenderPhases.slice(
      routeNetIslandsPhaseIndex,
      routeNetIslandsPhaseIndex + 4,
    ),
  ).toEqual([
    "PcbRouteNetIslands",
    "PcbDifferentialPairPostProcess",
    "PcbCopperPourRender",
    "PcbDesignRuleChecks",
  ])
})
