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
        <signalintegrity name="WRITE" bitRate="20Mbps" unrouted="ideal">
          <signal
            name="DQ0"
            driver=".TX0 > .Y"
            receiver=".RX > .A1"
            strobe={kind === "self" ? "DQ0" : "DQS"}
          />
          <signal
            name="DQS"
            driver=".TX1 > .Y"
            receiver=".RX > .A2"
            strobe={kind === "cycle" ? "DQ0" : undefined}
            quiet={kind === "quiet" ? "low" : undefined}
            pattern={kind === "constant" ? "000" : "clock"}
          />
        </signalintegrity>
      </StrobeBoard>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(
      kind === "self" || kind === "cycle"
        ? 'Signal "DQ0": strobe must name a different signal without a dependency cycle.'
        : 'Signal "DQ0": strobe "DQS" must switch.',
    )
  }
})
