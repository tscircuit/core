import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("netlabel display name is independent from electrical net identity", () => {
  const { circuit } = getTestFixture()
  const netLabelWithDisplayNameProps = {
    net: "IBAT_HS_POS",
    displayName: "IBAT_HS+",
    connectsTo: "R1.pin1",
    schX: 0,
    schY: 0,
    anchorSide: "right",
  } as const

  circuit.add(
    <board routingDisabled>
      <resistor name="R1" resistance="1k" schX={2} />
      <netlabel {...(netLabelWithDisplayNameProps as any)} />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_net.list()).toContainEqual(
    expect.objectContaining({ name: "IBAT_HS_POS" }),
  )
  expect(circuit.db.schematic_net_label.list()).toContainEqual(
    expect.objectContaining({ text: "IBAT_HS+" }),
  )
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
