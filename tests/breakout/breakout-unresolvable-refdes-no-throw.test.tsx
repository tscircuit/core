import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Regression: a <trace> with an unresolvable/ambiguous selector (e.g. a bare
// refdes ".R1" on a multi-pin component) used to throw an uncaught
// TraceConnectionError from Breakout.doInitialCreateAutoplacedBreakoutPoints,
// which iterates every board trace before source rendering records the error.
// A single bad selector should now degrade to a source_trace_not_connected_error
// instead of crashing the whole render.
test("breakout render tolerates a trace with an unresolvable bare refdes", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <breakout name="B1" autorouter="auto" padding="0.7mm">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
      </breakout>
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
      {/* good cross-boundary trace */}
      <trace from="R1.1" to="R2.1" />
      {/* bad trace: bare refdes on a 2-pin component -> unresolvable */}
      <trace from=".R1" to=".R2" />
    </board>,
  )

  await expect(circuit.renderUntilSettled()).resolves.toBeUndefined()

  const errors = circuit
    .getCircuitJson()
    .filter((c: any) => c.type === "source_trace_not_connected_error")

  expect(errors).toHaveLength(1)
  expect((errors[0] as any).message).toContain(
    'Could not find port for selector ".R1"',
  )
})
