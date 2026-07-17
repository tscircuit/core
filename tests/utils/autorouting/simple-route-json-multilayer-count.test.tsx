import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("simple route json preserves a ten-layer board layerCount", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" layers={10} routingDisabled>
      <via pcbX={0} pcbY={0} fromLayer="top" toLayer="inner8" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbBoard = circuit.db.pcb_board.list()[0]
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  expect(pcbBoard?.num_layers).toBe(10)
  expect(simpleRouteJson.layerCount).toBe(10)
  expect(simpleRouteJson.obstacles[0]?.layers).toEqual([
    "top",
    "inner1",
    "inner2",
    "inner3",
    "inner4",
    "inner5",
    "inner6",
    "inner7",
    "inner8",
  ])
})
