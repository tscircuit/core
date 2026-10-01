import { expect, test } from "bun:test"
import { DrcCheck } from "lib/components/primitive-components/DrcCheck"
import { runCorePromise } from "lib/effect/core-error"

test("custom DRC's native Effect and Promise facade retain diagnostic and failure identity", async () => {
  let executions = 0
  const diagnosticCheck = new DrcCheck({
    name: "native",
    checkFn: () => {
      executions++
      return {
        message: "native diagnostic",
        source_component_ids: [],
        source_port_ids: [],
      }
    },
  })
  const program = diagnosticCheck.runCustomDrcCheckEffect([])
  expect(executions).toBe(0)
  const native = await runCorePromise(program)
  const compatibility = await diagnosticCheck.runCustomDrcCheck([])
  expect(executions).toBe(2)
  expect(compatibility).toEqual(native)
  expect(native[0]).toMatchObject({
    type: "source_component_misconfigured_error",
    message: "native diagnostic",
  })
  const cause = { message: "custom failure" }
  const failureCheck = new DrcCheck({
    checkFn: () => {
      throw cause
    },
  })
  expect(await failureCheck.runCustomDrcCheck([]).catch((error) => error)).toBe(
    cause,
  )
  expect(
    await runCorePromise(failureCheck.runCustomDrcCheckEffect([])).catch(
      (error) => error,
    ),
  ).toBe(cause)
})
