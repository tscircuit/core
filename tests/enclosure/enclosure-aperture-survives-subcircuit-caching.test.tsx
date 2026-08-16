import { expect, test } from "bun:test"
import { enclosure } from "lib"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * `<enclosure.cutoutaperture>` emits no Circuit JSON of its own -- deliberately,
 * because a solver input is not something the interchange format should carry.
 *
 * Subcircuit isolation replaces a subtree with `AnyCircuitElement[]` and rebuilds
 * it from the inflators, so a declaration with no record has nothing to be
 * rebuilt from. Before the guard, the aperture inside the cached subcircuit was
 * dropped without a word: the enclosure rendered, looked fine, and was missing
 * an opening.
 */
test("an aperture inside a cached subcircuit is not silently dropped", () => {
  const warnings: string[] = []
  const originalWarn = console.warn
  console.warn = (...args: unknown[]) => warnings.push(args.join(" "))

  const { circuit } = getTestFixture()
  let enclosureSolverEvent: SolverStartedEvent | undefined
  circuit.on("solver:started", (event) => {
    if (event.solverName === "CreateFdmEnclosureSolver") {
      enclosureSolverEvent = event
    }
  })

  const verticalFootprint = (
    <footprint insertionDirection="from_above">
      <smtpad portHints={["pin1"]} width="2mm" height="2mm" shape="rect" />
    </footprint>
  )

  circuit.add(
    <group>
      <board name="B1" width="30mm" height="20mm" routingDisabled>
        <subcircuit name="module" _subcircuitCachingEnabled>
          <chip name="SW1" pcbX="6mm" pcbY="-3mm" footprint={verticalFootprint}>
            <enclosure.cutoutaperture shape="circle" radius="3mm" />
          </chip>
        </subcircuit>
        <chip name="SW2" pcbX="-6mm" pcbY="3mm" footprint={verticalFootprint}>
          <enclosure.cutoutaperture shape="circle" radius="3mm" />
        </chip>
      </board>
      <enclosure.fdm.box boardRef=".B1" />
    </group>,
  )
  circuit.render()

  console.warn = originalWarn

  expect(enclosureSolverEvent?.solverParams.apertures).toHaveLength(2)

  const warning = warnings.join("\n")
  expect(warning).toContain("subcircuit caching disabled")
  expect(warning).toContain("enclosurecutoutaperture")
})
