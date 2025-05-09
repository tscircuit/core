import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render a jumper with pinrow4 footprint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <jumper
        name="J1"
        footprint="solderjumper2"
        pinCount={2}
        pcbX={0}
        pcbY={0}
        schX={0}
        schY={0}
      />
      <jumper
        name="J2"
        footprint="solderjumper2_bridged12"
        pinCount={2}
        internallyConnectedPins={[["1", "2"]]}
        pcbX={2}
        pcbY={2}
        schX={2}
        schY={2}
        schRotation={90}
      />
      <jumper
        name="J3"
        footprint="solderjumper3_bridged12"
        pinCount={3}
        internallyConnectedPins={[["1", "2"]]}
        pcbX={-2}
        pcbY={-2}
        schX={-2}
        schY={-2}
      />
      <jumper
        name="J4"
        footprint="solderjumper3_bridged123"
        pinCount={3}
        internallyConnectedPins={[
          ["1", "2"],
          ["2", "3"],
        ]}
        pcbX={2}
        pcbY={-2}
        schX={2}
        schY={-2}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
