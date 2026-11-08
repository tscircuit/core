import { expect, test } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import { getSiTestFixture } from "./fixtures/get-si-test-fixture"

test("SI diagnostic: bare quiet needs an explicit level", async () => {
  const { circuit } = getSiTestFixture()
  // @ts-expect-error Boolean quiet deliberately reproduces invalid user TSX.
  const signal = (
    <signal name="DATA" driver=".TX > .Y" receiver=".RX > .A" quiet />
  )
  circuit.add(
    <DiagnosticBoard>
      <signalintegrity bitRate="20Mbps" unrouted="ideal">
        {signal}
      </signalintegrity>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'quiet needs a level: "low", "high" or "off".',
  )
})
