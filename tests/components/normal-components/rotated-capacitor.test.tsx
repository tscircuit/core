import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render rotated versions of capacitors", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <capacitor
        name="C1"
        schY={0}
        schX={3}
        capacitance="10k"
        schRotation="90deg"
      />

      <capacitor
        name="C2"
        schY={0}
        schX={6}
        capacitance="10k"
        schRotation="180deg"
      />

      <capacitor
        name="C3"
        schY={0}
        schX={9}
        capacitance="10k"
        schRotation="270deg"
      />

      <capacitor
        name="C4"
        schY={3}
        schX={3}
        capacitance="10k"
        schRotation="-90deg"
      />

      <capacitor name="C5" schY={3} schX={6} capacitance="10k" />
    </board>,
  )

  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
