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
  const failures = json.filter((element) => element.type === "drc_check_error")
  expect(failures).toHaveLength(2)
  expect(failures).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        cause: "geometry failure",
        check_name: expect.stringContaining("sync-failure"),
        is_fatal: true,
      }),
      expect.objectContaining({
        cause: "non-Error rejection",
        check_name: expect.stringContaining("async-failure"),
        is_fatal: true,
      }),
    ]),
  )
  const board = circuit.db.pcb_board.list()[0]!
  for (const failure of failures) {
    expect(failure.pcb_board_id).toBe(board.pcb_board_id)
    expect(failure.subcircuit_id).toBe(board.subcircuit_id)
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
  expect(circuit.db.drc_check_error.list()).toHaveLength(2)
  expect(completedChecks).toBe(1)
})
