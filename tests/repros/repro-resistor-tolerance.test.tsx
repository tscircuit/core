import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const requestedTolerance = "5%"

const createReproBoard = (observedTolerance?: string) => {
  const status =
    observedTolerance === JSON.stringify(requestedTolerance)
      ? "correct"
      : "failing"

  return (
    <board width="20mm" height="12mm">
      <resistor
        name="R1"
        resistance="1k"
        tolerance={requestedTolerance}
        footprint="0402"
      />
      <pcbnotetext
        pcbY={-4}
        fontSize={0.7}
        text={`requested tolerance: ${JSON.stringify(requestedTolerance)}\nobserved tolerance: ${observedTolerance}\nstatus: ${status}`}
      />
    </board>
  )
}

test.failing("resistor should serialize tolerance into Circuit JSON", () => {
  const { circuit } = getTestFixture()
  circuit.add(createReproBoard())
  circuit.render()

  const resistor = circuit.db.source_component
    .list()
    .find((component) => component.name === "R1")
  const resistorOutput = resistor as unknown as Record<string, unknown>
  const observedTolerance = JSON.stringify(resistorOutput.tolerance)

  const { circuit: snapshotCircuit } = getTestFixture()
  snapshotCircuit.add(createReproBoard(observedTolerance))
  snapshotCircuit.render()

  expect(snapshotCircuit).toMatchPcbSnapshot(import.meta.path)
  expect(resistor?.ftype).toBe("simple_resistor")
  expect(resistorOutput.tolerance).toBeDefined()
})
