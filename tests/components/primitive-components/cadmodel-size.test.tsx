import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("child cadmodel preserves authored size in millimeters like object cadModel", () => {
  const expectedSize = { x: 6, y: 4, z: 20 }
  for (const size of [
    expectedSize,
    { x: "0.6cm", y: "4mm", z: "0.02m" },
    undefined,
  ]) {
    const { circuit } = getTestFixture()
    const modelUrl = "https://example.com/model.step"
    circuit.add(
      <board width={20} height={20} routingDisabled>
        <resistor
          name="R_CHILD"
          resistance={1000}
          footprint="0402"
          pcbX={0}
          pcbY={0}
          cadModel={<cadmodel modelUrl={modelUrl} size={size} />}
        />
        <resistor
          name="R_OBJECT"
          resistance={1000}
          footprint="0402"
          pcbX={0}
          pcbY={0}
          cadModel={{
            stepUrl: modelUrl,
            size: size ? expectedSize : undefined,
          }}
        />
      </board>,
    )
    circuit.render()

    const cadComponents = circuit.db.cad_component.list()
    expect(cadComponents).toHaveLength(2)
    for (const cad of cadComponents) {
      expect(cad.size).toEqual(size ? expectedSize : undefined)
    }
  }
})
