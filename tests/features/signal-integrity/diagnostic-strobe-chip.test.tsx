import { signalintegrity } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { StrobeBoard } from "./fixtures/strobe-board"
import { Octal } from "./fixtures/parts"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("each data receiver needs exactly one physical strobe receiver on its chip", async () => {
  for (const ambiguous of [false, true]) {
    const { circuit } = getSiTestFixture()
    circuit.add(
      <StrobeBoard>
        <Octal name="OTHER" pcbX={20} />
        <trace from=".TX1 > .Y" to=".OTHER > .A2" />
        <signalintegrity.simulation
          name="WRITE"
          bitRate="20Mbps"
          unrouted="ideal"
        >
          <signalintegrity.signal
            name="DQ0"
            driverRef=".TX0 > .Y"
            receiverRef=".RX > .A1"
            strobeRef="DQS"
          />
          <signalintegrity.signal
            name="DQS"
            driverRef=".TX1 > .Y"
            receiverRef={
              ambiguous ? [".RX > .A2", ".RX > .A2"] : ".OTHER > .A2"
            }
            pattern="clock"
          />
        </signalintegrity.simulation>
      </StrobeBoard>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(
      'Signal "DQ0": expected exactly one DQS receiver on .RX.',
    )
  }
})
