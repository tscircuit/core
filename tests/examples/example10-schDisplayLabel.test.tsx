import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("Should not render any schematic components", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20} autorouter="sequential-trace">
      <resistor
        name="R1"
        footprint="0603"
        schX={8}
        schY={-1}
        pcbX={0}
        resistance="10k"
      />
      <resistor
        name="R2"
        footprint="0603"
        schX={0}
        schY={-1}
        pcbX={4}
        resistance="10k"
      />
      <capacitor
        name="C1"
        footprint="0603"
        schX={4}
        schY={1}
        pcbX={-4}
        capacitance="10k"
      />
      <capacitor
        name="C2"
        footprint="0603"
        schX={2}
        schY={0}
        pcbX={-8}
        capacitance="10k"
      />

      <trace from={".C1 > .pin1"} to={".R2 > .pin1"} />
      <trace schDisplayLabel="C2_POS" path={[".C1 > .pin2", ".C2 > .pin2"]} />
      <trace
        pcbRouteHints={[{ x: 2, y: -8 }]}
        schDisplayLabel="C2_POS"
        from={".C2 > .pin2"}
        to={".R1 > .pin2"}
      />
      <trace
        pcbRouteHints={[{ x: 2, y: -8 }]}
        schDisplayLabel="R1_1"
        from={".R1 > .pin1"}
        to={".C2 > .pin1"}
      />
    </board>,
  )

  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
