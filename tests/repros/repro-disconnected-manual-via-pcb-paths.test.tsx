import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { DisconnectedManualViaPcbPathsBoard } from "tests/fixtures/manual-via-transition"

test.failing(
  "pcbPaths rejects copper that does not touch the via",
  async () => {
    const { circuit } = getTestFixture()
    circuit.schematicDisabled = true
    circuit.add(<DisconnectedManualViaPcbPathsBoard />)
    await circuit.renderUntilSettled()

    const sourceTrace = circuit.db.source_trace.list()[0]!
    expect(
      circuit.db.pcb_trace_error
        .list()
        .some(
          (error) =>
            error.source_trace_id === sourceTrace.source_trace_id &&
            /via.*does not reach.*top/i.test(error.message),
        ),
    ).toBe(true)
    expect(circuit.db.pcb_trace.list()).toHaveLength(0)
    expect(circuit.db.pcb_via.list()).toHaveLength(0)
  },
)
