import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("named point-to-point trace gets a horizontal inline net label", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20} schMaxTraceDistance={5}>
      <chip name="U1" footprint="soic8" schX={0} schY={0} />
      <led name="LED1" footprint="0603" schX={5} schY={0} />

      <trace
        schDisplayLabel="USER_LED_ANODE"
        from=".U1 > .pin5"
        to=".LED1 > .anode"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const inlineLabels = circuit.db.schematic_text
    .list()
    .filter((text) => text.text === "USER_LED_ANODE")

  expect(inlineLabels).toHaveLength(1)
  const inlineLabel = inlineLabels[0]!

  // The label runs along the wire instead of hanging off the end of it, so no
  // anchored net label is emitted for this net.
  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "USER_LED_ANODE"),
  ).toHaveLength(0)

  // The wire is horizontal, so the label is unrotated and sits above it.
  expect(inlineLabel.rotation).toBe(0)
  const traceEdges = circuit.db.schematic_trace.list()[0]!.edges
  const horizontalEdge = traceEdges.find(
    (edge) => Math.abs(edge.from.y - edge.to.y) < 1e-6,
  )!
  expect(inlineLabel.position.y).toBeGreaterThan(horizontalEdge.from.y)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
