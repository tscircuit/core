import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unitId outside shell throws a compilation error", () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board>
      <mosfet
        unitId="A"
        channelType="n"
        mosfetMode="enhancement"
        pinMapping={{ gate: "2", source: "1", drain: "3" }}
      />
    </board>,
  )

  expect(() => circuit.render()).toThrow(
    '<mosfet> unitId="A" must be a direct child of a <shell> (received parent <board>)',
  )
})
