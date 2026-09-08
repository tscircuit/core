import { expect, test } from "bun:test"
import { any_circuit_element, schematic_component } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pinheader schematic port_arrangement emits numeric pins that parse", async () => {
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
  expect(
    (sc as { port_arrangement?: { right_side?: { pins?: unknown } } })
      .port_arrangement?.right_side?.pins,
  ).toEqual([1, 2])
  expect(schematic_component.safeParse(sc).success).toBe(true)
  expect(any_circuit_element.safeParse(sc).success).toBe(true)
})
