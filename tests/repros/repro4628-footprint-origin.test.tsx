import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const lobePoints = Array.from({ length: 33 }, (_, vertexIndex) => ({
  x: 0.6 + 0.32 * Math.cos((vertexIndex * Math.PI) / 16),
  y: 0.6 + 0.32 * Math.sin((vertexIndex * Math.PI) / 16),
}))

test("CAD and exported footprint origins stay on the reference hole for equivalent circle and polygon copper", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={40} height={30} routingDisabled schematicDisabled>
      <pcbnotetext
        text="CAD crosses must remain on each reference hole"
        pcbY={13}
        fontSize={0.8}
      />
      <group pcbX={1} pcbY={-1} pcbRotation={90}>
        {["top", "bottom"].map((layer, layerIndex) =>
          [0, 90, 180, 270].map((rotation, rotationIndex) =>
            ["circle", "polygon"].map((shape, shapeIndex) => (
              <chip
                key={`${layer}_${rotation}_${shape}`}
                name={`${layer}_${rotation}_${shape}`}
                layer={layer as "top" | "bottom"}
                pcbX={-8 + rotationIndex * 5}
                pcbY={-11 + layerIndex * 12 + shapeIndex * 5}
                pcbRotation={rotation}
                cadModel={
                  shape === "circle" ? (
                    { stepUrl: "https://example.com/contact.step" }
                  ) : (
                    <cadmodel
                      modelUrl="https://example.com/contact.step"
                      stepUrl="https://example.com/contact.step"
                    />
                  )
                }
                footprint={
                  <footprint>
                    <platedhole
                      shape="circle"
                      holeDiameter={0.78}
                      outerDiameter={1.3}
                      portHints={["1"]}
                    />
                    {shape === "circle" ? (
                      <smtpad
                        shape="circle"
                        radius={0.32}
                        pcbX={0.6}
                        pcbY={0.6}
                        layer="top"
                        portHints={["1"]}
                      />
                    ) : (
                      <smtpad
                        shape="polygon"
                        points={lobePoints}
                        layer="top"
                        portHints={["1"]}
                      />
                    )}
                    <pcbnotetext
                      text={`${layer} ${rotation}° ${shape}`}
                      pcbY={-1.5}
                      fontSize={0.35}
                    />
                  </footprint>
                }
              />
            )),
          ),
        )}
      </group>
    </board>,
  )
  circuit.render()
  const comparisons = circuit.db.pcb_component.list().map((component) => {
    const hole = circuit.db.pcb_plated_hole
      .list()
      .find((hole) => hole.pcb_component_id === component.pcb_component_id)!
    const cad = circuit.db.cad_component
      .list()
      .find(
        (cad) =>
          cad.pcb_component_id === component.pcb_component_id &&
          Boolean(cad.model_step_url),
      )!
    const expectedOrigin = { x: hole.x, y: hole.y }
    circuit.db.pcb_note_text.insert({
      text: "+",
      anchor_position: cad.position,
      anchor_alignment: "center",
      layer: "top",
      font: "tscircuit2024",
      font_size: 0.7,
    })
    return { component, cad, expectedOrigin }
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1300,
    height: 1000,
    showErrorsInTextOverlay: false,
  })
  expect(comparisons).toHaveLength(16)
  for (const { component, cad, expectedOrigin } of comparisons) {
    expect(cad.position.x).toBeCloseTo(expectedOrigin.x)
    expect(cad.position.y).toBeCloseTo(expectedOrigin.y)
    expect(component).toMatchObject({
      footprint_origin: {
        x: expect.closeTo(expectedOrigin.x),
        y: expect.closeTo(expectedOrigin.y),
      },
    })
    // Both authored shapes represent the same lobe; both must contribute bounds.
    expect(component.width).toBeCloseTo(1.57)
    expect(component.height).toBeCloseTo(1.57)
  }
})
