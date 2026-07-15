import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("shell rejects an incomplete unit pin mapping", () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board>
      <shell name="Q1">
        <mosfet
          unitId="A"
          channelType="n"
          mosfetMode="enhancement"
          pinMapping={{ gate: "1", source: "2" }}
        />
      </shell>
    </board>,
  )

  expect(() => circuit.render()).toThrow(
    '<mosfet> unitId="A" pinMapping is missing terminals: drain',
  )
})
