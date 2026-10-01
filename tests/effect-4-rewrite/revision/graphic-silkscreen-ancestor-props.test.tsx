import { expect, test } from "bun:test"
import { renderGraphicConvergence } from "./shared-convergence-fixture"

test("H1: pending silkscreen output survives ancestor props and equals a fresh render", async () => {
  const changed = await renderGraphicConvergence({
    graphic: "silkscreen",
    changeAncestor: true,
  })
  const fresh = await renderGraphicConvergence({
    graphic: "silkscreen",
    changeAncestor: false,
  })
  expect(fresh.output.some((row) => row.type === "pcb_silkscreen_graphic")).toBe(
    true,
  )
  expect(fresh.output.some((row) => row.type === "pcb_silkscreen_path")).toBe(
    true,
  )
  expect(changed.fetchCalls).toBe(1)
  expect(changed.output).toEqual(fresh.output)
})
