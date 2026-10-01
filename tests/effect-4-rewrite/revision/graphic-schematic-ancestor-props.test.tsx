import { expect, test } from "bun:test"
import { renderGraphicConvergence } from "./shared-convergence-fixture"

test("H2: pending schematic output survives ancestor props and equals a fresh render", async () => {
  const changed = await renderGraphicConvergence({
    graphic: "schematic",
    changeAncestor: true,
  })
  const fresh = await renderGraphicConvergence({
    graphic: "schematic",
    changeAncestor: false,
  })
  expect(fresh.output).toHaveLength(1)
  expect(changed.fetchCalls).toBe(1)
  expect(changed.output).toEqual(fresh.output)
})
