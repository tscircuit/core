import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("assembly.screen rejects missing, ambiguous, and non-PCB targets", () => {
  for (const [connectsTo, message] of [
    [".MISSING", "matched 0 components; expected exactly one"],
    ["connector", "matched 2 components; expected exactly one"],
    [".VCC", "but it has no PCB component"],
  ]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device name="device">
        <board name="B1" width={30} height={20} routingDisabled>
          <connector name="J1" pinCount={2} footprint="pinrow2" pcbX={-5} />
          <connector name="J2" pinCount={2} footprint="pinrow2" pcbX={5} />
          <net name="VCC" />
        </board>
        <assembly.screen
          name="SCREEN"
          connectsTo={connectsTo}
          width={20}
          height={10}
        />
      </assembly.device>,
    )
    expect(() => circuit.render()).toThrow(message)
  }
})
