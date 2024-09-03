import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { Net } from "lib/components/primitive-components/Net"

it("should create a Net component with correct properties", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <net name="COM" />
      <resistor name="R1" resistance="10k" pcbX={-2} footprint="0402" />
      <resistor name="R2" resistance="10k" pcbX={2} footprint="0402" />
      <resistor name="R3" resistance="10k" pcbX={4} pcbY={2} footprint="0402" />
      <resistor
        name="R4"
        resistance="10k"
        pcbX={-2}
        pcbY={2}
        footprint="0402"
      />
      <trace from=".R1 > pin.1" to="net.COM" />
      <trace from=".R2 > pin.2" to="net.COM" />
      <trace from=".R3 > pin.1" to="net.COM" />
      <trace from=".R4 > pin.1" to="net.COM" />
    </board>,
  )

  project.render()

  const pcbTraces = project.db.pcb_trace.list()

  // expect(pcbTraces.length).toBe(2)

  expect(project.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
