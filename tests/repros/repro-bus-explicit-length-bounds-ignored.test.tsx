import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("standalone bus length bounds survive conversion to router constraints", async () => {
  const { circuit } = getTestFixture()
  const inputs: SimpleRouteJson[] = []
  circuit.on("autorouting:start", (event) => inputs.push(event.simpleRouteJson))
  circuit.add(
    <board width={40} height={20} schematicDisabled routeRemaining={false}>
      <autoroutingphase name="DATA" phaseIndex={0} autorouter="bus_lanes" />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-10} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={10} />
      <trace name="DATA" from="R1.pin2" to="R2.pin1" />
      <bus
        name="DDR_BYTE"
        connections={["DATA"]}
        routingPhaseIndex={0}
        minLength="19mm"
        maxLength="20mm"
        pcbAllowedLayers={["top"]}
      />
      <pcbnotetext
        text="DDR_BYTE: explicit length bounds 19–20 mm"
        pcbY={6}
        fontSize={0.7}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.source_bus.list()[0]).toMatchObject({
    min_length: 19,
    max_length: 20,
  })
  expect(inputs).toHaveLength(1)
  expect(inputs[0].buses?.[0]).toMatchObject({ minLength: 19, maxLength: 20 })
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  const route = circuit.db.pcb_trace.list()[0].route
  const length = route.slice(1).reduce((sum, point, index) => {
    const previous = route[index]
    if (point.route_type !== "wire" || previous.route_type !== "wire") {
      throw new Error("Expected a planar top-layer route")
    }
    return sum + Math.hypot(point.x - previous.x, point.y - previous.y)
  }, 0)
  expect(length).toBeGreaterThanOrEqual(19 - 1e-7)
  expect(length).toBeLessThanOrEqual(20 + 1e-7)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
