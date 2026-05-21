import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board with laser_prefab preset", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board autorouter="laser_prefab">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        layer={"bottom"}
        pcbX={5}
        pcbY={0}
      />
      <via
        fromLayer="top"
        toLayer="bottom"
        pcbX={0}
        pcbY={4}
        netIsAssignable={true}
      />
      <trace from=".C1 > .pos" to=".R1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
