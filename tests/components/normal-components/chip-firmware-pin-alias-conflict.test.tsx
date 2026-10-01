import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("contradictory firmware declarations through aliases fail instead of overwriting", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "ENABLE" }}
        pinAttributes={{
          pin1: { initialOutputState: "high" },
          ENABLE: { initialOutputState: "low" },
        }}
      />
    </board>,
  )
  expect(() => circuit.render()).toThrow(
    "Conflicting pinAttributes.initialOutputState",
  )
})
