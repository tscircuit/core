import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routing group overrides preserve zero and otherwise inherit the board trace rule", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={6} routingDisabled
      autorouter={{ traceClearance: 0.1 }} minTraceToPadEdgeClearance={0.05}>
      <group name="G1" subcircuit autorouter={{ traceClearance: 0 }} pcbX={-2}>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </group>
      <group name="G2" subcircuit pcbX={2}>
        <resistor name="R2" resistance="1k" footprint="0402" />
      </group>
      <pcbnotetext text="G1: explicit 0 mm; G2: inherited 0.1 mm trace clearance"
        pcbY={2} fontSize={0.25} />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const [name, expected] of [["G1", 0], ["G2", 0.1]] as const) {
    const group = circuit.db.pcb_group.list().find((group) => group.name === name)!
    const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
      circuitJson: circuit.getCircuitJson(), subcircuit_id: group.subcircuit_id,
    })
    expect(simpleRouteJson.minDifferentNetTraceEdgeToTraceEdgeClearance).toBe(expected)
    expect(simpleRouteJson.minTraceToPadEdgeClearance).toBe(0.05)
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
