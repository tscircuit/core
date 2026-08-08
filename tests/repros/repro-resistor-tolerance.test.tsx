import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const createReproBoard = (observedTolerance?: string) => (
  <board width="20mm" height="12mm">
    <resistor
      name="R1"
      resistance="1k"
      tolerance="5%"
      footprint="0402"
    />
    <pcbnotetext
      pcbY={-4}
      fontSize={0.7}
      text={`Requested R1 tolerance: 5%\nObserved source_component.tolerance: ${observedTolerance ?? "?"}`}
    />
  </board>
)

test("resistor tolerance is accepted but absent from Circuit JSON", () => {
  const { circuit } = getTestFixture()
  circuit.add(createReproBoard())
  circuit.render()

  const resistor = circuit.db.source_component.list().find(
    (component) => component.name === "R1",
  )
  const observedTolerance = JSON.stringify(resistor?.tolerance)

  const { circuit: snapshotCircuit } = getTestFixture()
  snapshotCircuit.add(createReproBoard(observedTolerance))
  snapshotCircuit.render()

  expect(snapshotCircuit).toMatchPcbSnapshot(import.meta.path)
  expect(resistor?.ftype).toBe("simple_resistor")
  expect(observedTolerance).toBeUndefined()
})
