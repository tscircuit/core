import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("failed DRC checks are serialized without losing the circuit or successful diagnostics", async () => {
  const { circuit } = getTestFixture()
  let completedChecks = 0
  circuit.add(
    <board width={12} height={8} routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" />
      <drccheck
        name="sync-failure"
        checkFn={() => {
          throw new Error("geometry failure")
        }}
      />
      <drccheck
        name="async-failure"
        checkFn={async () => {
          throw "non-Error rejection"
        }}
      />
      <drccheck
        name="successful-check"
        checkFn={async () => {
          await Promise.resolve()
          completedChecks++
          return {
            message: "Existing design violation",
            source_component_ids: [],
            source_port_ids: [],
          }
        }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const json = circuit
    .getCircuitJson()
    .map((element) =>
      any_circuit_element.parse(JSON.parse(JSON.stringify(element))),
    )
  const failures = json.filter(
    (element) => element.type === "source_runtime_error",
  )
  expect(failures).toHaveLength(2)
  expect(failures).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        message: expect.stringMatching(/sync-failure.*geometry failure/),
      }),
      expect.objectContaining({
        message: expect.stringMatching(/async-failure.*non-Error rejection/),
      }),
    ]),
  )
  for (const failure of failures) {
    expect(failure.phase_name).toBe("PcbDesignRuleChecks")
    expect(failure.message).toContain("DRC could not complete")
  }
  expect(
    json.some(
      (element: { type: string; message?: string }) =>
        element.message === "Existing design violation",
    ),
  ).toBe(true)
  expect(circuit.db.pcb_component.list()).toHaveLength(1)
  await circuit.renderUntilSettled()
  expect(circuit.db.source_runtime_error.list()).toHaveLength(2)
  expect(completedChecks).toBe(1)
})
