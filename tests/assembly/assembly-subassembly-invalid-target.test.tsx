import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("screen targets must resolve to exactly one placeable object", () => {
  for (const [connectsTo, message] of [
    [".missing", "matched 0 components"],
    [".duplicate", "matched 2 components"],
    [".VCC", "but it has no PCB component"],
  ]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device name="device">
        <assembly.screen
          name="target"
          connectsTo={connectsTo}
          width={10}
          height={10}
        />
        <assembly.cadassembly name="duplicate" />
        <assembly.subassembly name="duplicate" />
        <board name="board" width={20} height={20} routingDisabled>
          <net name="VCC" />
        </board>
      </assembly.device>,
    )
    expect(() => circuit.render()).toThrow(message)
  }
})
