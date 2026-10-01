import { expect, test } from "bun:test"
import { renderIsolatedConvergence } from "./shared-convergence-fixture"

test("H3 sharing: producer props preserve both consumers of one pending isolated render", async () => {
  const changed = await renderIsolatedConvergence({ change: "own", consumers: 2 })
  const fresh = await renderIsolatedConvergence({ change: "none", consumers: 2 })
  expect(fresh.output.filter((row) => row.type === "source_component")).toHaveLength(
    2,
  )
  expect(fresh.output.filter((row) => row.type === "pcb_smtpad")).toHaveLength(4)
  expect(changed.resolverCalls).toBe(1)
  expect(fresh.resolverCalls).toBe(1)
  expect(changed.output).toEqual(fresh.output)
})
