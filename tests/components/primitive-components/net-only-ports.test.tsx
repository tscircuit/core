import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("routes traces between ports when net has no traces", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm" autorouter="sequential-trace">
      <net name="COM" />
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={-2} />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={2} />
    </board>,
  )

  project.render()

  const pcbTraces = project.db.pcb_trace.list()

  expect(pcbTraces.length).toBe(3)
})
