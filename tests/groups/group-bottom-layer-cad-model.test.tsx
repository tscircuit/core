import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("both CAD model forms move to the opposite board face with their component", async () => {
  const jsxModel = (
    <cadmodel modelUrl="/test-model.glb" zOffsetFromSurface={0.25} />
  )
  const objectModel = { glbUrl: "/test-model.glb", zOffsetFromSurface: 0.25 }
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={24}
      height={18}
      thickness={2}
      schematicDisabled
      routingDisabled
    >
      <group layer="bottom">
        <chip name="U1" footprint="soic8" pcbX={4} cadModel={jsxModel} />
        <chip
          name="U2"
          footprint="soic8"
          pcbX={-4}
          layer="bottom"
          cadModel={objectModel}
        />
      </group>
      <pcbnotetext
        text="JSX model: bottom | Object model: top"
        pcbY={6}
        fontSize={0.5}
      />
    </board>,
  )

  const { circuit: explicitFlip } = getTestFixture()
  explicitFlip.add(
    <board
      width={24}
      height={18}
      thickness={2}
      schematicDisabled
      routingDisabled
    >
      <group>
        <chip
          name="U1"
          footprint="soic8"
          pcbX={-4}
          layer="bottom"
          cadModel={jsxModel}
        />
        <chip
          name="U2"
          footprint="soic8"
          pcbX={4}
          layer="top"
          cadModel={objectModel}
        />
      </group>
      <pcbnotetext
        text="JSX model: bottom | Object model: top"
        pcbY={6}
        fontSize={0.5}
      />
    </board>,
  )

  explicitFlip.render()
  circuit.render()

  await expect(explicitFlip.getCircuitJson()).toMatchPcbSnapshot(
    import.meta.path,
  )
  expect(circuit.db.cad_component.list()).toEqual(
    explicitFlip.db.cad_component.list(),
  )
  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
