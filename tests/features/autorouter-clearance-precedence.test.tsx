import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subcircuit trace clearance sets a floor on the phase minimum", async () => {
  const { circuit } = getTestFixture({ platform: { schematicDisabled: true } })
  const clearances: Array<number | undefined> = []
  circuit.on("autorouting:start", ({ simpleRouteJson }) =>
    clearances.push(simpleRouteJson.minTraceToPadEdgeClearance),
  )
  circuit.add(
    <board width={16} height={12} minTraceToPadEdgeClearance={0.6}>
      <group
        subcircuit
        autorouter={{ preset: "auto_local", traceClearance: "0.35mm" }}
      >
        <autoroutingphase minTraceToPadEdgeClearance={0.2} />
        <resistor name="R1" footprint="0402" resistance="1k" pcbX={-4} />
        <resistor name="R2" footprint="0402" resistance="1k" pcbX={4} />
        <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      </group>
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(clearances).toEqual([0.35])
})
