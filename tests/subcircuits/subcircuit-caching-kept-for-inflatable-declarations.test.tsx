import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * The counterpart to
 * `subcircuit-caching-declined-for-uninflatable-declaration.test.tsx`: a guard
 * that declines everything is as useless as one that declines nothing, so this
 * pins that a subcircuit built only from components the inflators rebuild still
 * caches, and warns about nothing.
 */
test("a subcircuit built only from inflatable declarations is still cached", async () => {
  const warnings: string[] = []
  const originalWarn = console.warn
  console.warn = (...args: unknown[]) => warnings.push(args.join(" "))
  const { circuit } = getTestFixture()

  const Module = ({ name }: { name: string }) => (
    <subcircuit name={name} _subcircuitCachingEnabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} />
      <capacitor name="C1" capacitance="100nF" footprint="0402" pcbY={2} />
      <trace from=".R1 .pin1" to=".C1 .pin1" />
      <silkscreentext text="mod" pcbY={-2} />
      {/* standalone primitives, inflated since #3262 */}
      <hole pcbX={3} pcbY={0} diameter="1mm" />
    </subcircuit>
  )

  circuit.add(
    <board width="40mm" height="24mm" routingDisabled>
      <Module name="S1" />
      <Module name="S2" />
    </board>,
  )
  await circuit.renderUntilSettled()

  console.warn = originalWarn

  expect(circuit.cachedSubcircuits!.size).toBe(1)
  expect(circuit.db.source_component.list()).toHaveLength(4)
  expect(circuit.db.pcb_hole.list()).toHaveLength(2)
  expect(
    warnings.filter((line) => line.includes("subcircuit caching disabled")),
  ).toEqual([])
})
