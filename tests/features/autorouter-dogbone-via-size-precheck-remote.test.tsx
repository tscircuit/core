import { expect, test } from "bun:test"
import { DogboneViaSizePrecheckBoard } from "tests/fixtures/dogbone-via-size-precheck-board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("oversized dogbone vias stop remote routing before requesting a job", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  const routingErrors: string[] = []
  circuit.on("autorouting:error", (event) =>
    routingErrors.push(event.error.message),
  )
  circuit.add(
    <DogboneViaSizePrecheckBoard
      autorouter={{ serverUrl: "https://router.invalid", serverMode: "job" }}
    />,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(1)
  expect(routingErrors).toHaveLength(1)
  expect(routingErrors[0]).toContain("does not allow dogboning U1.")
  // The fixture rejects all external HTTP requests; reaching the remote
  // routing path would fail instead of producing this diagnostic.
  expect(circuit.db.pcb_trace.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
