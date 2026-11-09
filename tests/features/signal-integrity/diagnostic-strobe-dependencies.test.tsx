import { signalintegrity } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { StrobeBoard } from "./fixtures/strobe-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("self-strobes, cycles and quiet strobes are rejected including constant patterns", async () => {
  for (const kind of ["self", "cycle", "quiet", "constant"]) {
    const { circuit } = getSiTestFixture()
    circuit.add(
      <StrobeBoard>
        <signalintegrity.simulation
          name="WRITE"
          bitRate="20Mbps"
          unrouted="ideal"
        >
          <signalintegrity.signal
            name="DQ0"
            driverRef=".TX0 > .Y"
            receiverRef=".RX > .A1"
            strobeRef={kind === "self" ? "DQ0" : "DQS"}
          />
          <signalintegrity.signal
            name="DQS"
            driverRef=".TX1 > .Y"
            receiverRef=".RX > .A2"
            strobeRef={kind === "cycle" ? "DQ0" : undefined}
            quiet={kind === "quiet" ? "low" : undefined}
            pattern={kind === "constant" ? "000" : "clock"}
          />
        </signalintegrity.simulation>
      </StrobeBoard>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(
      kind === "self" || kind === "cycle"
        ? 'Signal "DQ0": strobe must name a different signal without a dependency cycle.'
        : 'Signal "DQ0": strobe "DQS" must switch.',
    )
  }
})
