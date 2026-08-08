import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("inline net label spans a route with a small elbow jog", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20}>
      <chip name="U1" footprint="soic8" schX={0} schY={0} />
      <led name="LED1" footprint="0603" schX={3} schY={0} />

      <trace
        schDisplayLabel="USER_LED_ANODE"
        from=".U1 > .pin5"
        to=".LED1 > .anode"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // No single straight run of this route fits the name, but the route is
  // straight except for a small elbow jog, so the label is centered over the
  // route's overall span instead of falling back to an anchored label.
  const inlineLabels = circuit.db.schematic_text
    .list()
    .filter((text) => text.text === "USER_LED_ANODE")
  expect(inlineLabels).toHaveLength(1)
  const inlineLabel = inlineLabels[0]!

  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "USER_LED_ANODE"),
  ).toHaveLength(0)

  // Centered over the route and clear of its full vertical extent - never
  // extending past the route's endpoints.
  expect(inlineLabel.rotation).toBe(0)
  const traceEdges = circuit.db.schematic_trace.list()[0]!.edges
  const routePoints = traceEdges.flatMap((edge) => [edge.from, edge.to])
  const routeMinX = Math.min(...routePoints.map((p) => p.x))
  const routeMaxX = Math.max(...routePoints.map((p) => p.x))
  const routeMaxY = Math.max(...routePoints.map((p) => p.y))
  expect(inlineLabel.position.x).toBeGreaterThan(routeMinX)
  expect(inlineLabel.position.x).toBeLessThan(routeMaxX)
  expect(inlineLabel.position.y).toBeGreaterThan(routeMaxY)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
