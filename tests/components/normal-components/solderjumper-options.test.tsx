import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render solderjumper options/variations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="35mm">
      <solderjumper
        name="SJ1"
        footprint="solderjumper2"
        schX={0}
        schY={0}
        pcbX={0}
        pcbY={0}
      />
      <solderjumper
        name="SJ2"
        footprint="solderjumper2_bridged12"
        schX={0}
        schY={5}
        pcbX={0}
        pcbY={5}
      />
      <solderjumper
        name="SJ3"
        pinCount={2}
        bridgedPins={[["1", "2"]]}
        schX={0}
        schY={10}
        pcbX={0}
        pcbY={10}
      />
      <solderjumper
        name="SJ4"
        footprint="solderjumper3_bridged123"
        schX={0}
        schY={15}
        pcbX={0}
        pcbY={15}
      />
      <solderjumper
        name="SJ5"
        pinCount={3}
        bridgedPins={[["2", "3"]]}
        schX={0}
        schY={20}
        pcbX={0}
        pcbY={20}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
