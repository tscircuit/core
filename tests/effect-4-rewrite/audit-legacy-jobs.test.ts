import { expect, test } from "bun:test"
import { buildInventory } from "../../scripts/effect-4/inventory"

test("every production async render job uses the owned Effect entrypoint", () => {
  const inventory = buildInventory()
  expect(inventory.legacyQueueCalls).toEqual([])
  expect(inventory.renderPhaseCount).toBe(69)
  expect(
    inventory.phaseCoverage.every((phase, index) => phase.phaseIndex === index),
  ).toBe(true)
})
