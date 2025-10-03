import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

const uShapedOutline = [
  { x: -6, y: -6 },
  { x: -2, y: -6 },
  { x: -2, y: 2 },
  { x: 2, y: 2 },
  { x: 2, y: -6 },
  { x: 6, y: -6 },
  { x: 6, y: 6 },
  { x: -6, y: 6 },
]

test("simple route json includes board outline when provided", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      outline={uShapedOutline}
      autorouter={{
        local: true,
        groupMode: "subcircuit",
      }}
    >
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-4}
        pcbY={-4}
      />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={-4} />
      <trace from=".R1 > .pin2" to=".R2 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  expect(simpleRouteJson.outline).toBeDefined()
  expect(simpleRouteJson.outline).toHaveLength(uShapedOutline.length)
  expect(simpleRouteJson.outline).toEqual(uShapedOutline)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
