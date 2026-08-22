import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board passes routing layer and via span constraints to the autorouter", async () => {
  const { circuit } = getTestFixture()
  let autorouterInput: SimpleRouteJson | undefined

  circuit.on("autorouting:start", ({ simpleRouteJson }) => {
    autorouterInput = simpleRouteJson
  })

  circuit.add(
    <board
      width="12mm"
      height="8mm"
      layers={4}
      routingLayers={["top", { name: "bottom" }]}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_board.list()[0]).toMatchObject({
    routing_layers: ["top", "bottom"],
    via_span_policy: "through_only",
  })
  expect(autorouterInput?.routingLayers).toEqual(["top", "bottom"])
  expect(autorouterInput?.viaSpanPolicy).toBe("through_only")
})
