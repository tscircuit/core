import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ports connected by trace do not emit source_pin_missing_trace_warning (fixes tscircuit#4442)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={5} pcbY={0} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <trace from=".R1 > .pin2" to=".R2 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const warnings = circuit
    .getCircuitJson()
    .filter((e) => e.type === "source_pin_missing_trace_warning")

  expect(warnings).toHaveLength(0)
})

test("only unconnected ports retain source_pin_missing_trace_warning", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={5} pcbY={0} />
      {/* Only connect pin1, leaving pin2 of both resistors unconnected */}
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const warnings = circuit
    .getCircuitJson()
    .filter((e) => e.type === "source_pin_missing_trace_warning") as any[]

  expect(warnings).toHaveLength(2)
  const warnedPortNames = warnings.map((w) => w.message)
  expect(warnedPortNames.some((m) => m.includes("pin2 on R1"))).toBe(true)
  expect(warnedPortNames.some((m) => m.includes("pin2 on R2"))).toBe(true)
  expect(warnedPortNames.some((m) => m.includes("pin1"))).toBe(false)
})
