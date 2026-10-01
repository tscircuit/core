import { expect, test } from "bun:test"
import type { CustomDrcCheckInput } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("removed custom checks cannot insert late diagnostics or errors while sibling checks complete", async () => {
  const success = Promise.withResolvers<CustomDrcCheckInput>()
  const failure = Promise.withResolvers<CustomDrcCheckInput>()
  const successEntered = Promise.withResolvers<void>()
  const failureEntered = Promise.withResolvers<void>()
  const { circuit } = getTestFixture({ platform: { schematicDisabled: true } })
  circuit.add(
    <board width={10} height={10} routingDisabled>
      <drccheck
        name="removed-success"
        checkFn={() => {
          successEntered.resolve()
          return success.promise
        }}
      />
      <drccheck
        name="removed-failure"
        checkFn={() => {
          failureEntered.resolve()
          return failure.promise
        }}
      />
      <drccheck
        name="retained"
        checkFn={() => ({
          type: "schematic_error",
          error_type: "schematic_port_not_found",
          schematic_error_id: "retained-check",
          message: "retained diagnostic",
        })}
      />
    </board>,
  )
  const settled = circuit.renderUntilSettled()
  await Promise.all([successEntered.promise, failureEntered.promise])
  const removedSuccess = circuit.selectOne("drccheck.removed-success")!
  const removedFailure = circuit.selectOne("drccheck.removed-failure")!
  removedSuccess.parent!.remove(removedSuccess)
  removedFailure.parent!.remove(removedFailure)
  const lateDiagnostic: CustomDrcCheckInput = {
    type: "schematic_error",
    error_type: "schematic_port_not_found",
    schematic_error_id: "removed-check",
    message: "late diagnostic",
  }
  success.resolve(lateDiagnostic)
  failure.reject(new Error("late rejection"))
  await settled
  expect(circuit.db.source_runtime_error.list()).toHaveLength(0)
  expect(
    circuit.db.schematic_error.list().map((error) => error.message),
  ).toEqual(["retained diagnostic"])
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  await circuit.dispose()
})
