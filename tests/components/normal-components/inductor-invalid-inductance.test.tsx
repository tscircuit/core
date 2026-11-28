import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("invalid inductance prop reports validation error instead of emitting NaN", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <inductor name="L1" footprint="0603" inductance="not-an-inductance" />
      <inductor name="L2" footprint="0603" inductance="10V" />
      <inductor name="L3" footprint="0603" inductance="-5uH" />
      <inductor name="L4" footprint="0603" inductance={Number.NaN} />
      <inductor name="L5" footprint="0603" inductance="10uh" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const creationErrors = circuitJson.filter(
    (e) => e.type === "source_failed_to_create_component_error",
  )

  expect(creationErrors.map((e) => e.component_name).sort()).toEqual([
    "L1",
    "L2",
    "L3",
    "L4",
  ])
  for (const err of creationErrors) {
    expect(err.message).toContain("inductance")
  }

  expect(circuit.db.source_component.getWhere({ name: "L1" })).toBeNull()
  expect(circuit.db.source_component.getWhere({ name: "L2" })).toBeNull()
  expect(circuit.db.source_component.getWhere({ name: "L3" })).toBeNull()
  expect(circuit.db.source_component.getWhere({ name: "L4" })).toBeNull()

  const validInductor = circuit.db.source_component.getWhere({ name: "L5" })
  expect(validInductor).toMatchObject({
    ftype: "simple_inductor",
    display_inductance: "10µH",
  })
  expect(
    validInductor && "inductance" in validInductor
      ? validInductor.inductance
      : null,
  ).toBeCloseTo(1e-5, 10)
})
