import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("opamp component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <net name="vcc" isPowerNet />
      <net name="vee" isGroundNet />
      <opamp
        name="U1"
        connections={{
          inverting_input: "net.in_neg",
          non_inverting_input: "net.in_pos",
          output: "net.out",
          positive_supply: "net.vcc",
          negative_supply: "net.vee",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const netLabels = circuit.db.schematic_net_label.list().map((l) => l.text)
  expect(netLabels).toEqual(["in_pos", "in_neg", "out", "vcc", "vee"])

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})

test("opamp without power connections", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <opamp
        name="U1"
        connections={{
          inverting_input: "net.in_neg",
          non_inverting_input: "net.in_pos",
          output: "net.out",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(`${import.meta.path}-no-power`)
})
