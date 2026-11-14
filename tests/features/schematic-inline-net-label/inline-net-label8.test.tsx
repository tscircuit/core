import { expect, test } from "bun:test"
import { INLINE_NET_LABEL_FONT_SIZE } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/applyInlineNetLabelEligibility"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("two-endpoint trace with schDisplayLabel joined by a third branch trace in a subcircuit renders inline schematic_text", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={30} height={20} routingDisabled>
      <group
        name="PinchDetectionSignalChain"
        subcircuit
        schMaxTraceDistance={5}
      >
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

        <trace from="R_SHUNT.pin2" to="R_FILTER.pin1" />
        <trace
          name="V-PLUS-INPUT"
          from="J1.V_PLUS"
          to="R_FILTER.pin1"
          schDisplayLabel="V+"
        />
      </group>
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

test("two disconnected branched traces with the same schDisplayLabel remain separate inline labels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={30} height={30} routingDisabled schMaxTraceDistance={5}>
      <resistor name="R1" resistance="10k" schX={-6} schY={4} />
      <resistor name="R2" resistance="10k" schX={-2} schY={4} />
      <resistor name="R3" resistance="10k" schX={2} schY={4} />

      <resistor name="R4" resistance="10k" schX={-6} schY={-4} />
      <resistor name="R5" resistance="10k" schX={-2} schY={-4} />
      <resistor name="R6" resistance="10k" schX={2} schY={-4} />

      <trace path={["R1.pin2", "R2.pin1", "R3.pin1"]} schDisplayLabel="BUS" />
      <trace path={["R4.pin2", "R5.pin1", "R6.pin1"]} schDisplayLabel="BUS" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const inlineLabels = circuit.db.schematic_text
    .list()
    .filter((text) => text.text === "BUS")
  expect(inlineLabels).toHaveLength(2)
  expect(new Set(inlineLabels.map((label) => label.source_trace_id)).size).toBe(
    2,
  )
  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "BUS"),
  ).toHaveLength(0)
})
