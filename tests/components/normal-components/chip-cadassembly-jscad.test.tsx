import { expect, test } from "bun:test"
import type { CadComponent } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getJscadColor = (cadComponent: CadComponent) => {
  const jscad = cadComponent.model_jscad
  if (!jscad || typeof jscad !== "object" || !("color" in jscad)) {
    throw new Error("Expected a colored JSCAD CAD component")
  }
  return jscad.color
}

test("chip CAD assemblies preserve separate JSCAD bodies", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="soic8"
        pcbX={2}
        pcbY={3}
        cadModel={
          <cadassembly>
            <cadmodel
              jscad={{
                type: "colorize",
                color: [1, 0, 0],
                shape: { type: "cuboid", size: [2, 2, 1] },
              }}
              pcbX={-2}
              pcbZ={1}
              showAsTranslucentModel
            />
            <cadmodel
              jscad={{
                type: "colorize",
                color: [0, 0, 1],
                shape: { type: "cuboid", size: [1, 3, 2] },
              }}
              pcbX={2}
              pcbZ={1.5}
            />
          </cadassembly>
        }
      />
    </board>,
  )

  circuit.render()

  const pcbComponent = circuit.db.pcb_component.list()[0]
  const cadComponents = circuit.db.cad_component.list()

  expect(cadComponents).toHaveLength(2)
  expect(cadComponents.map(getJscadColor)).toEqual([
    [1, 0, 0],
    [0, 0, 1],
  ])
  expect(cadComponents.map(({ position }) => position)).toEqual([
    { x: 0, y: 3, z: 1.7 },
    { x: 4, y: 3, z: 2.2 },
  ])
  expect(
    cadComponents.map(
      ({ show_as_translucent_model }) => show_as_translucent_model,
    ),
  ).toEqual([true, undefined])
  expect(
    cadComponents.every(
      ({ pcb_component_id }) =>
        pcb_component_id === pcbComponent?.pcb_component_id,
    ),
  ).toBe(true)

  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path)
})
