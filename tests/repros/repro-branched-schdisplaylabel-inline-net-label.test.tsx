import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A schDisplayLabel on a trace that branches to 3+ ports used to render as
// anchored schematic_net_label endpoints detached from the wire. It should
// render inline on the routed wire like any other named trace.
test("schDisplayLabel on a branched 3-port trace renders as an inline net label", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={20}>
      <chip name="U1" footprint="soic8" schX={0} schY={0} />
      <resistor name="R1" resistance="10" footprint="0603" schX={6} schY={-2} />
      <resistor name="R2" resistance="10" footprint="0603" schX={6} schY={2} />
      <trace
        name="V-PLUS-INPUT"
        schDisplayLabel="V+"
        path={[".U1 > .pin1", ".R1 > .pin1", ".R2 > .pin1"]}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const anchoredLabels = circuit.db.schematic_net_label
    .list()
    .filter((label) => label.text === "V+")
  expect(anchoredLabels).toHaveLength(0)

  const inlineLabels = circuit.db.schematic_text
    .list()
    .filter((text) => text.text === "V+")
  expect(inlineLabels.length).toBeGreaterThanOrEqual(1)

  // The net is routed: the branched trace produced wires
  expect(circuit.db.schematic_trace.list().length).toBeGreaterThanOrEqual(1)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
