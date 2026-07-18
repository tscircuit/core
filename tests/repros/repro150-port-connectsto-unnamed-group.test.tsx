import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ports in an unnamed group create schematic connectivity", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <group>
        <port name="INH" direction="right" connectsTo={["R20.pin1"]} />
        <port name="CTL" direction="left" connectsTo={["R20.pin2"]} />
        <resistor name="R20" resistance="100k" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace.list()).toHaveLength(2)
  expect(
    circuit.db.schematic_net_label.list().map((label) => label.text),
  ).toEqual(["INH", "CTL"])
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
