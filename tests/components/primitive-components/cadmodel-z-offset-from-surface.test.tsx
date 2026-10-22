import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

import "lib/register-catalogue"

test("cadmodel offsets follow the board surface on both layers", () => {
  for (const { layer, thickness, expectedZ } of [
    { layer: "top", thickness: undefined, expectedZ: 1.8 },
    { layer: "bottom", thickness: undefined, expectedZ: -1.8 },
    { layer: "top", thickness: "2.2mm", expectedZ: 2.1 },
    { layer: "bottom", thickness: "2.2mm", expectedZ: -2.1 },
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width="10mm" height="10mm" thickness={thickness}>
        <resistor
          name="R1"
          resistance={1000}
          footprint="0402"
          layer={layer}
          cadModel={
            <cadmodel
              modelUrl="https://example.com/model.glb"
              zOffsetFromSurface="1mm"
            />
          }
        />
      </board>,
    )
    circuit.render()

    const cadComponents = circuit.db.cad_component.list()
    expect(cadComponents).toHaveLength(1)
    expect(cadComponents[0].position.z).toBeCloseTo(expectedZ, 5)
  }
})
