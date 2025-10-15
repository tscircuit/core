import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

import "lib/register-catalogue"

test("cadmodel primitive respects zOffsetFromSurface on top layer", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance={1000}
        footprint="0402"
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
  expect(cadComponents[0].position.z).toBeCloseTo(1.4 / 2 + 1, 5)
})

test("cadmodel primitive respects zOffsetFromSurface on bottom layer", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance={1000}
        footprint="0402"
        layer="bottom"
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
  expect(cadComponents[0].position.z).toBeCloseTo(-(1.4 / 2 + 1), 5)
})

test("cadmodel primitive uses board thickness when zOffsetFromSurface provided", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" thickness="2.2mm">
      <resistor
        name="R1"
        resistance={1000}
        footprint="0402"
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
  expect(cadComponents[0].position.z).toBeCloseTo(2.2 / 2 + 1, 5)
})
