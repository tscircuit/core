import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board autorouter forwards configured trace clearance", async () => {
  const { circuit } = getTestFixture()
  let autorouterInput: SimpleRouteJson | undefined

  circuit.on("autorouting:start", ({ simpleRouteJson }) => {
    autorouterInput = simpleRouteJson
  })

  circuit.add(
    <board
      width="12mm"
      height="8mm"
      autorouter={{
        local: true,
        groupMode: "subcircuit",
        traceClearance: "0.15mm",
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(autorouterInput?.defaultObstacleMargin).toBe(0.15)
})
