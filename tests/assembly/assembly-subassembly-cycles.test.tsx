import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("assembly references reject self, indirect, screen, and inherited-parent cycles", () => {
  for (const createElements of [
    () => <assembly.subassembly name="a" connectsTo=".a" />,
    () => (
      <>
        <assembly.subassembly name="a" connectsTo=".b" />
        <assembly.cadassembly name="b" connectsTo=".a" />
      </>
    ),
    () => (
      <>
        <assembly.screen name="a" connectsTo=".b" width={10} height={10} />
        <assembly.subassembly name="b" connectsTo=".a" />
      </>
    ),
    () => (
      <assembly.subassembly name="a" connectsTo=".b">
        <assembly.cadassembly name="b" />
      </assembly.subassembly>
    ),
  ]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device name="device">{createElements()}</assembly.device>,
    )
    expect(() => circuit.render()).toThrow(
      /Assembly attachment cycle: (a -> a|a -> b -> a|b -> a -> b)/,
    )
  }
})
