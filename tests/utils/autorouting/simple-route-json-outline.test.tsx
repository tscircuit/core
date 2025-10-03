import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

const uShapedOutline = [
  { x: -8, y: -6 },
  { x: -2, y: -6 },
  { x: -2, y: 2 },
  { x: 2, y: 2 },
  { x: 2, y: -6 },
  { x: 8, y: -6 },
  { x: 8, y: 6 },
  { x: -8, y: 6 },
]

test("simple route json includes board outline when provided", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board outline={uShapedOutline}>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-5}
        pcbY={-4}
      />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={-4} />
      <trace from=".R1 > .pin2" to=".R2 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
