import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("solderjumper derives open and bridged footprints", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="8mm">
      <solderjumper name="SJ1" pinCount={2} pcbX={-11} />
      <solderjumper
        name="SJ2"
        pinCount={2}
        bridgedPins={[["1", "2"]]}
        pcbX={-5}
      />
      <solderjumper name="SJ3" pinCount={3} pcbX={1} />
      <solderjumper name="SJ4" pinCount={3} bridged pcbX={7} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_port.list()).toHaveLength(10)
  expect(circuit.db.pcb_trace.list()).toHaveLength(3)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
