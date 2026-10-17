import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a subcircuit group's step runs for its subcircuit and resolves selectors inside it", async () => {
  const { circuit } = getTestFixture()
  const seen: Array<{ subcircuitId?: string; portId?: string }> = []
  circuit.add(
    <board width="20mm" height="12mm">
      <group name="G1" subcircuit>
        <pcbpostroutingstep
          fn={(ctx) => {
            seen.push({
              subcircuitId: ctx.subcircuitId,
              portId: ctx.getPcbPort(".R1 > .pin1")?.pcb_port_id,
            })
          }}
        />
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-4}
          pcbY={0}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={4}
          pcbY={0}
        />
        <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      </group>
    </board>,
  )
  await circuit.renderUntilSettled()
  const cj = circuit.getCircuitJson()
  const group = cj.find(
    (e) => e.type === "source_group" && e.name === "G1",
  ) as any
  expect(seen).toHaveLength(1)
  expect(seen[0].subcircuitId).toBe(group.subcircuit_id)
  expect(seen[0].portId).toMatch(/^pcb_port_/)
})
