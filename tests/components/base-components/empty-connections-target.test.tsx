import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("empty or whitespace connection target emits source_component_misconfigured_error and preserves valid sibling connections", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        connections={{ pin1: "", pin2: ".R1 > .pin1" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const capacitorSource = circuit.db.source_component.getWhere({ name: "C1" })!
  const capacitorPin1 = circuit.db.source_port.getWhere({
    source_component_id: capacitorSource.source_component_id,
    pin_number: 1,
  })!
  const capacitorPin2 = circuit.db.source_port.getWhere({
    source_component_id: capacitorSource.source_component_id,
    pin_number: 2,
  })!
  const resistorSource = circuit.db.source_component.getWhere({ name: "R1" })!
  const resistorPin1 = circuit.db.source_port.getWhere({
    source_component_id: resistorSource.source_component_id,
    pin_number: 1,
  })!

  const errors = circuit.db.source_component_misconfigured_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]).toMatchObject({
    error_type: "source_component_misconfigured_error",
    source_component_ids: [capacitorSource.source_component_id],
    source_port_ids: [capacitorPin1.source_port_id],
  })
  expect(errors[0]!.message).toContain("C1")
  expect(errors[0]!.message).toContain("pin1")

  const sourceTraces = circuit.db.source_trace.list()
  expect(sourceTraces).toHaveLength(1)
  expect(sourceTraces[0]!.connected_source_port_ids).toEqual(
    expect.arrayContaining([
      capacitorPin2.source_port_id,
      resistorPin1.source_port_id,
    ]),
  )
})
