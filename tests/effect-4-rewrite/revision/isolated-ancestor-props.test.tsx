import { expect, test } from "bun:test"
import { renderIsolatedConvergence } from "./shared-convergence-fixture"

test("H3 ancestor: pending isolated children survive ancestor props without another resolver call", async () => {
  const changed = await renderIsolatedConvergence({ change: "ancestor" })
  const fresh = await renderIsolatedConvergence({ change: "none" })
  expect(fresh.output.filter((row) => row.type === "source_component")).toHaveLength(
    1,
  )
  expect(fresh.output.filter((row) => row.type === "pcb_smtpad")).toHaveLength(2)
  expect(changed.resolverCalls).toBe(1)
  expect(changed.output).toEqual(fresh.output)
})
