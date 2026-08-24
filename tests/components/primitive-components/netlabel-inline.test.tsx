import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("netlabel inline renders the net name along its schematic trace", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20} schMaxTraceDistance={10}>
      <resistor name="R1" resistance="1k" footprint="0603" schX={-3} schY={0} />
      <resistor name="R2" resistance="1k" footprint="0603" schX={3} schY={0} />
      <netlabel net="SIGNAL" connectsTo="R1.pin2" inline />
      <trace from="R2.pin1" to="net.SIGNAL" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.schematic_text
      .list()
      .filter((text) => text.text === "SIGNAL" && text.source_trace_id),
  ).toHaveLength(1)
  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "SIGNAL"),
  ).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
