import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nc net labels become symbols", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" schX={2} schY={2} />
      <netlabel
        anchorSide="right"
        schX={3}
        schY={2}
        schRotation={0}
        net="NC"
        connectsTo="R1.pin2"
      />

      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        schX={-2}
        schY={2}
        schRotation={180}
      />
      <netlabel
        anchorSide="left"
        schX={-3}
        schY={2}
        schRotation={180}
        net="NC"
        connectsTo="R2.pin2"
      />
      <resistor
        name="R3"
        resistance="10k"
        footprint="0402"
        schX={2}
        schY={-2}
        schRotation={90}
      />
      <netlabel
        anchorSide="bottom"
        schX={2}
        schY={-3}
        schRotation={90}
        net="NC"
        connectsTo="R3.pin1"
      />
      <resistor
        name="R4"
        resistance="10k"
        footprint="0402"
        schX={-2}
        schY={-2}
        schRotation={270}
      />
      <netlabel
        anchorSide="top"
        schX={-2}
        schY={-1}
        schRotation={270}
        net="NC"
        connectsTo="R4.pin1"
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
