import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("simple route json respects single-layer board layerCount", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" layers={1}>
      <testpoint
        name="TP1"
        footprintVariant="pad"
        pcbX={-2}
        pcbY={0}
        layer="top"
      />
      <testpoint
        name="TP2"
        footprintVariant="pad"
        pcbX={2}
        pcbY={0}
        layer="top"
      />
      <trace from="TP1.pin1" to="TP2.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  expect(simpleRouteJson.layerCount).toBe(1)
})
