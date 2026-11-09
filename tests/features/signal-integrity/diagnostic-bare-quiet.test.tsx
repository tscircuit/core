import { simulation } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("SI diagnostic: bare quiet needs an explicit level", async () => {
  const { circuit } = getSiTestFixture()
  const props = { name: "DATA", driverRef: ".TX > .Y", receiverRef: ".RX > .A" }
  // @ts-expect-error Boolean quiet deliberately reproduces invalid user TSX.
  const signal = <simulation.pcbchannel {...props} quiet />
  circuit.add(
    <DiagnosticBoard>
      <simulation.pcbtransientchannelsimulation
        bitRate="20Mbps"
        unrouted="ideal"
      >
        {signal}
      </simulation.pcbtransientchannelsimulation>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'quiet needs a level: "low", "high" or "off".',
  )
})
