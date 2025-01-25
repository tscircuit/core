import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should create traces between specified pins", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="testChip"
        pinLabels={{
          "1": "A",
          "2": "B",
          "3": "C",
          "4": "D",
        }}
        externallyConnectedPins={[
          ["1", "2"],
          ["3", "4"],
        ]}
      />
    </board>,
  )

  circuit.render()

  const chip = circuit.selectOne("chip")
  expect(chip).not.toBeNull()

  const traces = circuit.selectAll("trace")

  expect(traces).toHaveLength(2)
})
