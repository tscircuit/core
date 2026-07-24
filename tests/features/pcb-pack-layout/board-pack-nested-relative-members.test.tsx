import type { PackInput } from "calculate-packing"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board packing does not duplicate nested relatively positioned members as obstacles", async () => {
  const { circuit } = getTestFixture()
  let boardPackInput: PackInput | undefined

  circuit.on("solver:started", (event) => {
    if (
      event.solverName === "PackSolver2" &&
      event.componentName.startsWith("<board")
    ) {
      boardPackInput = event.solverParams
    }
  })

  circuit.add(
    <board pack routingDisabled>
      <group subcircuit>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-1}
          pcbY={0}
        />
        <capacitor
          name="C1"
          capacitance="10nF"
          footprint="0402"
          pcbX={1}
          pcbY={0}
        />
      </group>
      <group subcircuit>
        <resistor
          name="R2"
          resistance="2.2k"
          footprint="0402"
          pcbX={-1}
          pcbY={0}
        />
        <capacitor
          name="C2"
          capacitance="100nF"
          footprint="0402"
          pcbX={1}
          pcbY={0}
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(boardPackInput?.components).toHaveLength(2)
  expect(boardPackInput?.obstacles).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
