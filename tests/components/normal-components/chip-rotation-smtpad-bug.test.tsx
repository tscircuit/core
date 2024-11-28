import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip rotation should properly adjust SMT pad positions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm">
      <chip name="U1" pcbX={0} pcbY={0} footprint={"ms012"} />
      <chip
        name="U1"
        pcbX={-10}
        pcbY={-10}
        pcbRotation={90}
        footprint={"ms012"}
      />
      <chip
        name="U2"
        pcbX={10}
        pcbY={10}
        pcbRotation={45}
        footprint={"ms012"}
      />
    </board>,
  )

  circuit.render()

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
