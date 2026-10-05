import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("net-only pcbPath aborts rendering before a valid manual trace", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={10} height={8} routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0603" />
      <trace from="net.GND" to="net.GND" pcbPath={[{ x: 0, y: 2 }]} />
      <trace
        from="R1.pin1"
        to="net.GND"
        pcbPath={[
          { x: -2, y: 0 },
          { x: -2, y: 2 },
        ]}
      />
    </board>,
  )

  expect(() => circuit.render()).toThrow(TypeError)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  await expect(circuit.db.toArray()).toMatchPcbSnapshot(import.meta.path)
})
