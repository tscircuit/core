import { expect, test } from "bun:test"
import { INLINE_NET_LABEL_FONT_SIZE } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/applyInlineNetLabelEligibility"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicitly labeled leg of a branched net gets an inline label", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20} schMaxTraceDistance={5}>
      <testpoint
        name="TP_LEFT"
        footprint="platedhole"
        schX={0}
        schY={0}
        schRotation={180}
      />
      <testpoint name="TP_RIGHT" footprint="platedhole" schX={5} schY={0} />
      <resistor
        name="R1"
        resistance="1kohm"
        footprint="0603"
        schX={2}
        schY={2}
        schRotation={90}
      />

      <trace
        name="RESET_3V3"
        schDisplayLabel="3.3RESET"
        from=".TP_LEFT > .pin1"
        to=".TP_RIGHT > .pin1"
      />
      <trace from=".TP_LEFT > .pin1" to=".R1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const inlineLabels = circuit.db.schematic_text
    .list()
    .filter((text) => text.text === "3.3RESET")
  expect(inlineLabels).toHaveLength(1)
  expect(inlineLabels[0]!.font_size).toBe(INLINE_NET_LABEL_FONT_SIZE)
  expect(inlineLabels[0]!.source_trace_id).toBeTruthy()
  expect(inlineLabels[0]!.rotation).toBe(0)

  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "3.3RESET"),
  ).toHaveLength(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
