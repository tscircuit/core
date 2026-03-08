import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("normal component cad model uses containing board thickness inside panels", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="40mm" height="20mm" layoutMode="grid">
      <board width="10mm" height="10mm" thickness="2.2mm">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          cadModel={{ glbUrl: "https://example.com/model.glb" }}
        />
      </board>
    </panel>,
  )

  circuit.render()

  const cadComponents = circuit.db.cad_component.list()
  expect(cadComponents).toHaveLength(1)
  expect(cadComponents[0].position.z).toBeCloseTo(1.1) // half of the board thickness, since it's on the top layer
})
