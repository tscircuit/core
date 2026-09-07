import { expect, test } from "bun:test"
import {
  createCapacityAutorouterFixture,
  deferred,
} from "./capacity-mesh-autorouter-fixture"

test("an output failure reports an error after ending the routing run", async () => {
  const { autorouter, solver } = createCapacityAutorouterFixture()
  const failed = deferred()
  const errors: Error[] = []
  let routingDuringError: boolean | undefined
  let completions = 0
  solver.getOutputSimplifiedPcbTraces = () => {
    throw new Error("cannot extract routing output")
  }
  autorouter.on("complete", () => completions++)
  autorouter.on("error", (event) => {
    errors.push(event.error)
    routingDuringError = autorouter.isRouting
    failed.resolve()
  })

  autorouter.start()
  await failed.promise

  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain("cannot extract routing output")
  expect(completions).toBe(0)
  expect(routingDuringError).toBe(false)
})
