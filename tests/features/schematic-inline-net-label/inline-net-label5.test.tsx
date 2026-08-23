import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("two components joined through a named net get a routed inline label", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20} schMaxTraceDistance={5}>
      <chip
        name="U1"
        footprint="soic8"
        schX={0}
        schY={0}
        connections={{ pin5: "net.USER_SIGNAL" }}
      />
      <led
        name="LED1"
        footprint="0603"
        schX={4}
        schY={0}
        connections={{ anode: "net.USER_SIGNAL" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const inlineLabels = circuit.db.schematic_text
    .list()
    .filter((text) => text.text === "USER_SIGNAL")
  expect(inlineLabels).toHaveLength(1)
  expect(inlineLabels[0]!.source_trace_id).toBeTruthy()
  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "USER_SIGNAL"),
  ).toHaveLength(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
