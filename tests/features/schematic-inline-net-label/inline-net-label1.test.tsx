import { expect, test } from "bun:test"
import { INLINE_NET_LABEL_FONT_SIZE } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/applyInlineNetLabelEligibility"
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
  expect(inlineLabel.font_size).toBe(INLINE_NET_LABEL_FONT_SIZE)

  // The label runs along the wire instead of hanging off the end of it, so no
  // anchored net label is emitted for this net.
  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "USER_LED_ANODE"),
  ).toHaveLength(0)

  // The label points back at the trace it names, which is what tells it apart
  // from free-standing schematic text like a reference designator.
  const sourceTrace = circuit.db.source_trace.get(inlineLabel.source_trace_id!)
  expect(sourceTrace).toBeTruthy()
  expect(sourceTrace!.connected_source_port_ids).toHaveLength(2)
  expect(
    circuit.db.schematic_text.list().find((text) => text.text === "U1")
      ?.source_trace_id,
  ).toBeUndefined()

  // The wire is horizontal, so the label is unrotated and its lower edge sits
  // directly against the trace rather than floating in the gap above it.
  expect(inlineLabel.rotation).toBe(0)
  const traceEdges = circuit.db.schematic_trace.list()[0]!.edges
  const nearestHorizontalEdge = traceEdges
    .filter((edge) => Math.abs(edge.from.y - edge.to.y) < 1e-6)
    .sort(
      (edgeA, edgeB) =>
        Math.abs(inlineLabel.position.y - edgeA.from.y) -
        Math.abs(inlineLabel.position.y - edgeB.from.y),
    )[0]!
  expect(inlineLabel.position.y - nearestHorizontalEdge.from.y).toBeCloseTo(
    INLINE_NET_LABEL_FONT_SIZE / 2,
  )

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
