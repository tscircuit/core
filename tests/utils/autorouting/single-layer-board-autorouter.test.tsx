import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Ensure the default capacity autorouter can route on boards with a single layer
// and keeps all routing on the available layer.
test("default autorouter supports single-layer boards", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="8mm" layers={1}>
      <testpoint name="TP1" footprintVariant="pad" pcbX={-3} pcbY={0} />
      <testpoint name="TP2" footprintVariant="pad" pcbX={3} pcbY={0} />
      <trace from="TP1.pin1" to="TP2.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces.length).toBeGreaterThan(0)

  for (const trace of pcbTraces) {
    for (const segment of trace.route as any[]) {
      expect(segment.route_type).not.toBe("via")
      if (segment.layer) {
        expect(segment.layer).toBe("top")
      }
    }
  }

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  expect(simpleRouteJson.layerCount).toBe(1)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
