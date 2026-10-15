import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a subcircuit runs its own steps; the board runs only the board's", async () => {
  const { circuit } = getTestFixture()
  const runs: Array<[string, string | undefined]> = []
  circuit.add(
    <board width="20mm" height="12mm">
      <pcbpostroutingstep
        fn={(ctx) => {
          runs.push(["board", ctx.subcircuitId])
        }}
      />
      <group name="G1" subcircuit>
        <pcbpostroutingstep
          fn={(ctx) => {
            runs.push(["G1", ctx.subcircuitId])
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
  const subcircuitOf = (name?: string) =>
    (
      circuit
        .getCircuitJson()
        .find(
          (e) => e.type === "source_group" && (e as any).name === name,
        ) as any
    ).subcircuit_id
  // the subcircuit is routed and finishes first: children render before their parent
  expect(runs).toEqual([
    ["G1", subcircuitOf("G1")],
    ["board", subcircuitOf(undefined)],
  ])
})
