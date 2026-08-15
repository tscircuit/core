import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { schematic_component } from "circuit-json"

test("pinheader schematic port_arrangement contains numeric pins and passes circuit-json schema (#3075)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <pinheader name="J1" pinCount={2} footprint="pinrow2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sc = circuit
    .getCircuitJson()
    .find((e) => e.type === "schematic_component")

  expect(sc).toBeDefined()
  expect((sc as any).port_arrangement?.right_side?.pins).toEqual([1, 2])

  const parseResult = schematic_component.safeParse(sc)
  expect(parseResult.success).toBe(true)
})
