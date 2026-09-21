import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("screen attachment cycles are still rejected", () => {
  for (const target of ["a", "b"]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device name="device">
        <assembly.screen
          name="a"
          connectsTo={`.${target}`}
          width={10}
          height={10}
        />
        <assembly.screen name="b" connectsTo=".a" width={10} height={10} />
      </assembly.device>,
    )
    expect(() => circuit.render()).toThrow("Assembly attachment cycle")
  }
})
