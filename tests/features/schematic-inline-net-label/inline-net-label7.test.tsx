import { expect, test } from "bun:test"
import { INLINE_NET_LABEL_FONT_SIZE } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/applyInlineNetLabelEligibility"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("branched multi-pin trace with schDisplayLabel renders inline schematic_text instead of schematic_net_label", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={30} height={20} routingDisabled schMaxTraceDistance={5}>
      <pinheader
        name="J1"
        pinCount={2}
        pinLabels={{ pin1: "V_PLUS", pin2: "GND" }}
        schX={-11}
        schY={2.9}
        schFacingDirection="right"
      />
      <resistor
        name="R_SHUNT"
        resistance="20m"
        schX={-8.1}
        schY={3.2}
        schRotation="90deg"
      />
      <resistor name="R_FILTER" resistance="10" schX={-3.9} schY={2.4} />

      <trace
        name="V-PLUS-INPUT"
        path={["J1.V_PLUS", "R_SHUNT.pin2", "R_FILTER.pin1"]}
        schDisplayLabel="V+"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceTrace = circuit.db.source_trace.getWhere({ name: "V-PLUS-INPUT" })
  expect(sourceTrace).toBeTruthy()

  const inlineLabels = circuit.db.schematic_text
    .list()
    .filter((text) => text.text === "V+")
  expect(inlineLabels).toHaveLength(1)
  expect(inlineLabels[0]!.font_size).toBe(INLINE_NET_LABEL_FONT_SIZE)
  expect(inlineLabels[0]!.source_trace_id).toBe(sourceTrace!.source_trace_id)

  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "V+"),
  ).toHaveLength(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
