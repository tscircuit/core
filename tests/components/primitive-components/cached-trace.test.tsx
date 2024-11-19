import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"

test("trace caching between renders", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-2}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={2} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>
  )

  // First render
  circuit.render()
  
  const trace = circuit.selectOne("trace") as Trace
  const firstRoute = trace._cachedRoute

  expect(firstRoute).toBeTruthy()
  expect(firstRoute?.length).toBeGreaterThan(0)

  // Second render
  circuit.render()

  const trace2 = circuit.selectOne("trace") as Trace
  const secondRoute = trace2._cachedRoute

  // Verify the same cached route was used
  expect(firstRoute).toBe(secondRoute)
})
