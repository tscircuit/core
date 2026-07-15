import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("shell normalizes physical pin names when detecting collisions", () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board>
      <shell name="Q1">
        <mosfet
          unitId="A"
          channelType="n"
          mosfetMode="enhancement"
          pinMapping={{ gate: "1", source: "pin1", drain: "2" }}
        />
      </shell>
    </board>,
  )

  expect(() => circuit.render()).toThrow(
    '<shell name="Q1"> maps physical pin "pin1" more than once',
  )
})
