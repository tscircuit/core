import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace maxViaCount is emitted on the source trace and autorouter input", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" maxViaCount={2} />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_trace.list()).toHaveLength(1)
  expect(circuit.db.source_trace.list()[0].max_via_count).toBe(2)

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
  })
  expect(simpleRouteJson.connections).toHaveLength(1)
  expect(simpleRouteJson.connections[0].maxViaCount).toBe(2)
})
