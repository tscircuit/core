import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("crowded trace keeps its anchored net label instead of an inline one", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20}>
      <chip name="U1" footprint="soic8" schX={0} schY={0} />
      <led name="LED1" footprint="0603" schX={3} schY={0} />

      <trace
        schDisplayLabel="USER_LED_ANODE"
        from=".U1 > .pin5"
        to=".LED1 > .anode"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // The wire between these two parts is too short to carry the name without
  // running over a chip, so the label falls back to the anchored form rather
  // than being drawn on top of something.
  expect(
    circuit.db.schematic_text
      .list()
      .filter((text) => text.text === "USER_LED_ANODE"),
  ).toHaveLength(0)
  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "USER_LED_ANODE"),
  ).toHaveLength(1)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
