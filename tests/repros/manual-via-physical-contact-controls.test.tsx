import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ConnectedManualViaPcbPathBoard } from "tests/fixtures/manual-via-transition"

test("manual path remains valid when incoming copper touches the via", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  circuit.add(<ConnectedManualViaPcbPathBoard />)
  await circuit.renderUntilSettled()

  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.includes("error")),
  ).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.pcb_via.list()).toHaveLength(2)
  expect(circuit.db.pcb_via.list()[0]!.layers).toEqual([
    "top",
    "inner1",
    "inner2",
  ])
})
