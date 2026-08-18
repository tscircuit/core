import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("truly cramped trace keeps its anchored net label instead of an inline one", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20}>
      <chip name="U1" footprint="soic8" schX={0} schY={0} />
      <led name="LED1" footprint="0603" schX={2} schY={0} />

      <trace
        schDisplayLabel="USER_LED_ANODE"
        from=".U1 > .pin5"
        to=".LED1 > .anode"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Even the route's overall span is shorter than the name here, so there is
  // no way to draw it along the wire - the net keeps its anchored label
  // rather than overhanging into the chips.
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
