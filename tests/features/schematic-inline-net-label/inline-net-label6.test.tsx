import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a named multi-pin signal net is eligible for inline labels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20} schMaxTraceDistance={5}>
      <chip
        name="U1"
        footprint="soic8"
        schX={-4}
        schY={0}
        connections={{ pin5: "net.USER_BUS" }}
      />
      <led
        name="LED1"
        footprint="0603"
        schX={0}
        schY={0}
        connections={{ anode: "net.USER_BUS" }}
      />
      <chip
        name="U2"
        footprint="soic8"
        schX={4}
        schY={0}
        connections={{ pin1: "net.USER_BUS" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const inlineLabels = circuit.db.schematic_text
    .list()
    .filter((text) => text.text === "USER_BUS")
  expect(inlineLabels.length).toBeGreaterThan(0)
  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "USER_BUS"),
  ).toHaveLength(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
