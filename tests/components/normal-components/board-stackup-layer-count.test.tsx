import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("conflicting physical and routing layer counts report the named board", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      name="Layer mismatch"
      layers={4}
      stackup={{
        source: "specified",
        layers: [
          { type: "copper", layer: "top" },
          { type: "dielectric" },
          { type: "copper", layer: "bottom" },
        ],
      }}
    />,
  )
  expect(() => circuit.render()).toThrow(
    'Board "Layer mismatch" uses 4 copper layers, but its stackup declares 2. Set layers to match the supplied stackup.',
  )
})
