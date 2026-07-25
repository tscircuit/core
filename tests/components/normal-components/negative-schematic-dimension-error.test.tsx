import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const propertyErrors = (circuit: any) =>
  circuit
    .getCircuitJson()
    .filter((e: any) =>
      String(e.type).includes("invalid_component_property"),
    ) as any[]

test("non-positive schematic dimensions are reported", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="40mm" routingDisabled>
      <chip name="U1" footprint="soic8" schX={0} schWidth={-4} schHeight={3} />
      <schematicbox width={-2} height={2} schX={8} schY={0} />
      <schematiccircle center={{ x: 0, y: -8 }} radius={-1} />
      {/* A normal component in the same board must not be flagged. */}
      <resistor name="R1" resistance="1k" footprint="0402" schX={-8} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = propertyErrors(circuit)
  const messages = errors.map((e) => e.message).join("\n")

  // These used to be accepted silently: `size: { width: -4 }` and
  // `radius: -1` reached circuit JSON with zero errors.
  expect(errors.length).toBe(3)
  expect(messages).toContain("schWidth")
  expect(messages).toContain("schematic_box")
  expect(messages).toContain("schematic_circle")
  expect(messages).toContain("must be greater than zero")
  // The valid resistor's symbol must not appear.
  expect(messages).not.toContain("R1")
})

test("valid schematic dimensions raise no property errors", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="40mm" routingDisabled>
      <chip name="U1" footprint="soic8" schX={0} schWidth={4} schHeight={3} />
      <schematicbox width={2} height={2} schX={8} schY={0} />
      <schematiccircle center={{ x: 0, y: -8 }} radius={1} />
      <resistor name="R1" resistance="1k" footprint="0402" schX={-8} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(propertyErrors(circuit)).toEqual([])
})
