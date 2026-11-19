import { expect, test } from "bun:test"
import { INLINE_NET_LABEL_FONT_SIZE } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/applyInlineNetLabelEligibility"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("branched trace schDisplayLabel renders inline schematic_text instead of schematic_net_label", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20} schMaxTraceDistance={10} routingDisabled>
      <pinheader
        name="J1"
        pinCount={2}
        pinLabels={{ pin1: "V_PLUS", pin2: "GND" }}
        footprint="pinrow2"
        schX={-3}
        schY={0}
      />
      <resistor
        name="R_SHUNT"
        resistance="10m"
        footprint="0603"
        schX={0}
        schY={-2}
        schRotation={90}
      />
      <resistor
        name="R_FILTER"
        resistance="100"
        footprint="0603"
        schX={3}
        schY={0}
      />
      <trace
        name="V-PLUS-INPUT"
        path={[".J1 > .V_PLUS", ".R_SHUNT > .pin2", ".R_FILTER > .pin1"]}
        schDisplayLabel="V+"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceTrace = circuit.db.source_trace.getWhere({
    name: "V-PLUS-INPUT",
  })
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

const BranchedInputStage = () => (
  <subcircuit name="INPUT_STAGE" schMaxTraceDistance={10}>
    <pinheader
      name="J1"
      pinCount={2}
      pinLabels={{ pin1: "V_PLUS", pin2: "GND" }}
      footprint="pinrow2"
      schX={-3}
      schY={0}
    />
    <resistor
      name="R_SHUNT"
      resistance="10m"
      footprint="0603"
      schX={0}
      schY={-2}
      schRotation={90}
    />
    <resistor
      name="R_FILTER"
      resistance="100"
      footprint="0603"
      schX={3}
      schY={0}
    />
    <trace from=".J1 > .V_PLUS" to=".R_SHUNT > .pin2" />
    <trace
      name="V-PLUS-INPUT"
      from=".J1 > .V_PLUS"
      to=".R_FILTER > .pin1"
      schDisplayLabel="V+"
    />
  </subcircuit>
)

test("two-trace branched connectivity attributes inline schDisplayLabel to the labeled trace in standalone and composed subcircuits", async () => {
  const standalone = getTestFixture({ platform: { pcbDisabled: true } }).circuit
  standalone.add(<BranchedInputStage />)
  await standalone.renderUntilSettled()

  const standaloneLabeledTrace = standalone.db.source_trace.getWhere({
    name: "V-PLUS-INPUT",
  })
  expect(standaloneLabeledTrace).toBeTruthy()
  const standaloneInlineLabels = standalone.db.schematic_text
    .list()
    .filter((text) => text.text === "V+")
  expect(standaloneInlineLabels).toHaveLength(1)
  expect(standaloneInlineLabels[0]!.source_trace_id).toBe(
    standaloneLabeledTrace!.source_trace_id,
  )
  expect(
    standalone.db.schematic_net_label
      .list()
      .filter((label) => label.text === "V+"),
  ).toHaveLength(0)

  const composed = getTestFixture({ platform: { pcbDisabled: true } }).circuit
  composed.add(
    <board width={20} height={20} routingDisabled>
      <BranchedInputStage />
    </board>,
  )
  await composed.renderUntilSettled()

  const composedLabeledTrace = composed.db.source_trace.getWhere({
    name: "V-PLUS-INPUT",
  })
  expect(composedLabeledTrace).toBeTruthy()
  const composedInlineLabels = composed.db.schematic_text
    .list()
    .filter((text) => text.text === "V+")
  expect(composedInlineLabels).toHaveLength(1)
  expect(composedInlineLabels[0]!.source_trace_id).toBe(
    composedLabeledTrace!.source_trace_id,
  )
  expect(
    composed.db.schematic_net_label
      .list()
      .filter((label) => label.text === "V+"),
  ).toHaveLength(0)
})
