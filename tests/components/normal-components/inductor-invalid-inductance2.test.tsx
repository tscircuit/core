import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("inductor accepts valid numeric, bare-prefix, and case-insensitive Henry strings", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <inductor name="L1" inductance="10uH" footprint="0402" />
      <inductor name="L2" inductance="0.1uh" footprint="0402" />
      <inductor name="L3" inductance="100n" footprint="0402" />
      <inductor name="L4" inductance="10µH" footprint="0402" />
      <inductor name="L5" inductance={1e-6} footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.source_failed_to_create_component_error.list(),
  ).toHaveLength(0)

  const byName = new Map(
    circuit.db.source_component
      .list({ ftype: "simple_inductor" })
      .map((c: any) => [c.name, c]),
  )

  expect(byName.get("L1")?.inductance).toBe(0.00001)
  expect(byName.get("L2")?.inductance).toBe(1e-7)
  expect(byName.get("L3")?.inductance).toBe(1e-7)
  expect(byName.get("L4")?.inductance).toBe(0.00001)
  expect(byName.get("L5")?.inductance).toBe(0.000001)
})
