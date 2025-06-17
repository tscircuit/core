import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Ensure different solderjumper configuration paths all work together

test("solderjumper options/variations", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="35mm">
      {/* footprint only */}
      <solderjumper
        name="SJ1"
        footprint="solderjumper2"
        pcbX={0}
        pcbY={12}
        schX={0}
        schY={12}
      />

      {/* props only (bridged) */}
      <solderjumper
        name="SJ2"
        pinCount={2}
        bridgedPins={[["1", "2"]]}
        pcbX={0}
        pcbY={6}
        schX={0}
        schY={6}
      />

      {/* footprint string with bridged 23 */}
      <solderjumper
        name="SJ3"
        footprint="solderjumper3_bridged23"
        pcbX={0}
        pcbY={0}
        schX={0}
        schY={0}
      />

      {/* props + footprint */}
      <solderjumper
        name="SJ4"
        footprint="solderjumper3_bridged123"
        pinCount={3}
        bridgedPins={[
          ["1", "2"],
          ["2", "3"],
        ]}
        pcbX={0}
        pcbY={-6}
        schX={0}
        schY={-6}
      />

      {/* props only (3 pins, bridged12) */}
      <solderjumper
        name="SJ5"
        pinCount={3}
        bridgedPins={[["1", "2"]]}
        pcbX={0}
        pcbY={-12}
        schX={0}
        schY={-12}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
