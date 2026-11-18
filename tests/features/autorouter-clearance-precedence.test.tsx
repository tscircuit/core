import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("autorouter clearance respects phase overrides and reaches subcircuits", async () => {
  for (const scenario of [
    { clearance: undefined, minimum: 0.1, expected: 0.1 },
    { clearance: 0, minimum: 0.1, expected: 0.1 },
    { clearance: 0.35, minimum: 0.1, expected: 0.35 },
    { clearance: 0.35, minimum: 0.6, expected: 0.6 },
    { clearance: 0.35, minimum: 0.6, phaseMinimum: 0.2, expected: 0.35 },
    { clearance: 0.35, minimum: 0.1, phaseMinimum: 0.7, expected: 0.7 },
    { clearance: 0.45, minimum: 0.1, subcircuit: true, expected: 0.45 },
  ]) {
    const { circuit } = getTestFixture({
      platform: { schematicDisabled: true },
    })
    const inputs: SimpleRouteJson[] = []
    circuit.on("autorouting:start", ({ simpleRouteJson }) =>
      inputs.push(simpleRouteJson),
    )
    const autorouter = {
      preset: "auto_local" as const,
      traceClearance: scenario.clearance,
    }
    circuit.add(
      <board
        width={16}
        height={12}
        minTraceToPadEdgeClearance={scenario.minimum}
        autorouter={scenario.subcircuit ? undefined : autorouter}
      >
        <group
          subcircuit={scenario.subcircuit}
          autorouter={scenario.subcircuit ? autorouter : undefined}
        >
          <resistor name="R1" footprint="0402" resistance="1k" pcbX={-4} />
          <resistor name="R2" footprint="0402" resistance="1k" pcbX={4} />
          <trace from=".R1 > .pin2" to=".R2 > .pin1" />
          {scenario.phaseMinimum !== undefined && (
            <autoroutingphase
              minTraceToPadEdgeClearance={scenario.phaseMinimum}
            />
          )}
        </group>
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(inputs.length).toBeGreaterThan(0)
    expect(inputs[0].minTraceToPadEdgeClearance).toBe(scenario.expected)
    expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
  }
})
