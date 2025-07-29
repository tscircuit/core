import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// These tests ensure the detailed error messages for unresolved trace ports

/** Component not found */
test("error when component is missing", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
      <trace from="R2.1" to="net.GND" />
    </board>,
  )

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter(
    (c: any) => c.type === "source_trace_not_connected",
  )

  expect(errors.length).toBeGreaterThan(0)
  expect((errors[0] as any).message).toBe('Could not find port for selector "R2.1". Component "R2" not found')
})

/** Component found but has no ports */
test("error when component has no ports", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <group name="G1" />
      <trace from="G1.1" to="net.GND" />
    </board>,
  )

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter(
    (c: any) => c.type === "source_trace_not_connected",
  )

  expect(errors.length).toBeGreaterThan(0)
  expect((errors[0] as any).message).toBe('Could not find port for selector "G1.1". Component "G1" found, but does not have pin "1". It has no ports')
})

/** Component has only numbered pins and no labels */
test("error when component has numeric pins only", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader name="J1" pinCount={2} />
      <trace from="J1.3" to="net.GND" />
    </board>,
  )

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter(
    (c: any) => c.type === "source_trace_not_connected",
  )

  expect(errors.length).toBeGreaterThan(0)
  expect((errors[0] as any).message).toBe('Could not find port for selector "J1.3". Component "J1" found, but does not have pin "3". It has 2 pins and no pinLabels (consider adding pinLabels)')
})

/** Component has labeled pins */
test("error lists available labeled pins", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
      <trace from="R1.foo" to="net.GND" />
    </board>,
  )

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter(
    (c: any) => c.type === "source_trace_not_connected",
  )

  expect(errors.length).toBeGreaterThan(0)

  expect((errors[0] as any).message).toBe(
    'Could not find port for selector "R1\.foo"\. Component "R1" found, but does not have pin "foo"\. It has \[anode, pos, left, pin1, 1, cathode, neg, right, pin2, 2\]',
  )
})
