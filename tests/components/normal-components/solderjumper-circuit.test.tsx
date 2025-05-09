import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render a jumper with pinrow4 footprint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="15mm">
      <jumper
        name="J1"
        footprint="solderjumper3_bridged12"
        pinCount={3}
        internallyConnectedPins={[["1", "2"]]}
        pcbX={-4}
        pcbY={-4}
        schX={-2}
        schY={-2}
      />
      <resistor name="R1" footprint={"0402"} resistance={"4k"} />
      <trace from={".J1 > .pin1"} to={".R1 > .pin1"} />
      <trace from={".J1 > .pin3"} to={".R1 > .pin2"} />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
