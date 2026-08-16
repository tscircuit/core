import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * The other exit from a lossy round trip is loud but fatal: `inflateCircuitJson`
 * switches on `source_component.ftype` and throws for any it has no case for, so
 * a `<pinheader>` (`simple_pin_header`) inside a cached subcircuit killed the
 * render with "No inflator implemented for source component ftype".
 *
 * An optimization is not allowed to decide whether a board renders at all, so
 * the guard checks the round trip before taking it and this renders normally.
 */
test("a subcircuit holding an ftype with no inflator renders instead of throwing", async () => {
  const warnings: string[] = []
  const originalWarn = console.warn
  console.warn = (...args: unknown[]) => warnings.push(args.join(" "))

  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="24mm" routingDisabled>
      <subcircuit name="module" _subcircuitCachingEnabled>
        <pinheader name="J1" pinCount={2} pcbX={0} />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()

  console.warn = originalWarn

  expect(circuit.db.source_component.list().map((c) => c.name)).toEqual(["J1"])
  expect(circuit.cachedSubcircuits!.size).toBe(0)
  expect(warnings.join("\n")).toContain("subcircuit caching disabled")
})
