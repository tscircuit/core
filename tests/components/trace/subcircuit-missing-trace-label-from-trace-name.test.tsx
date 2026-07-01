import { expect, test } from "bun:test"
import type { SubcircuitProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const NamedTraceSubcircuit = (props: SubcircuitProps) => (
  <subcircuit name="MOD" {...props}>
    <chip
      name="U1"
      footprint="soic8"
      pinLabels={{ pin1: "SIG", pin2: "NC" }}
      schPinArrangement={{
        leftSide: { direction: "top-to-bottom", pins: ["SIG"] },
      }}
      schX={0}
      schY={0}
    />
    <pinheader name="J1" pinCount={1} pinLabels={["OUT"]} schX={5} schY={0} />
    <trace name="INT_SIG" from=".U1 > .SIG" to=".J1 > .OUT" />
  </subcircuit>
)

test("missing schematic trace labels inside subcircuit use trace name", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="14mm" height="8mm" routingDisabled schMaxTraceDistance={0.1}>
      <NamedTraceSubcircuit />
    </board>,
  )

  await circuit.renderUntilSettled()

  const netLabelTexts = circuit.db.schematic_net_label
    .list()
    .map((label) => label.text)

  expect(netLabelTexts).toContain("INT_SIG")
  expect(netLabelTexts).not.toContain("U1_SIG")
  expect(netLabelTexts).not.toContain("J1_OUT")

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
