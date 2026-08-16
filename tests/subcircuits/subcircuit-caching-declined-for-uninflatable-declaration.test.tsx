import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * A `<netlabel>` has a Circuit JSON record (`schematic_net_label`) and no
 * inflator, so isolating a subcircuit that contains one used to drop it: the
 * schematic rendered, looked fine, and had no label on the net.
 *
 * The guard declines isolation for anything the inflators cannot rebuild, and
 * says so, rather than trading a correct schematic for 1.0-1.33x.
 */
test("a subcircuit holding an uninflatable declaration is not cached, loudly", async () => {
  // bun's spyOn does not record calls on `console`, so the sink is swapped out
  // by hand.
  const warnings: string[] = []
  const originalWarn = console.warn
  console.warn = (...args: unknown[]) => warnings.push(args.join(" "))

  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="24mm" routingDisabled>
      <subcircuit name="module" _subcircuitCachingEnabled>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} />
        <netlabel
          net="VCC"
          schX={2}
          schY={2}
          anchorSide="left"
          connectsTo=".R1 > .pin1"
        />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()

  console.warn = originalWarn

  expect(circuit.db.schematic_net_label.list()).toHaveLength(1)
  expect(circuit.cachedSubcircuits!.size).toBe(0)

  const warning = warnings.join("\n")
  expect(warning).toContain("subcircuit caching disabled")
  expect(warning).toContain("netlabel")
})
