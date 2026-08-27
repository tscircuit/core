import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nested routing uses its owning board via policy", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="80mm" height="40mm">
      <board
        name="FIRST"
        width="20mm"
        height="15mm"
        layers={4}
        allowBlindAndBuriedVias={false}
        routingDisabled
      />
      <board
        name="SECOND"
        width="20mm"
        height="15mm"
        layers={8}
        allowBlindAndBuriedVias
        routingDisabled
      >
        <subcircuit name="TARGET">
          <resistor name="R1" resistance="1k" footprint="0402" />
        </subcircuit>
      </board>
    </panel>,
  )

  await circuit.renderUntilSettled()

  const targetGroup = circuit.db.source_group.getWhere({ name: "TARGET" })!
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
    subcircuit_id: targetGroup.subcircuit_id,
  })

  expect(simpleRouteJson.layerCount).toBe(8)
  expect(simpleRouteJson.allowBlindAndBuriedVias).toBe(true)
})
