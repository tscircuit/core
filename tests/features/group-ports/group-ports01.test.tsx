import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group with port that connects to internal component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <group name="G1" pcbX={0} pcbY={0} subcircuit>
        <resistor
          name="R_INSIDE_GROUP"
          resistance="10k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
        <port name="P1" direction="left" connectsTo="R_INSIDE_GROUP.pin1" />
      </group>
      <resistor
        name="R_OUTSIDE"
        resistance="10k"
        footprint="0402"
        pcbX={5}
        pcbY={0}
        connections={{ pin1: "G1.P1" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbGroups: true,
  })
})
