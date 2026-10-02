import { expect, test } from "bun:test"
import type { PcbSilkscreenGraphic as PcbSilkscreenGraphicElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const brepShape = {
  outer_ring: {
    vertices: [
      { x: -2, y: -1 },
      { x: 2, y: -1 },
      { x: 2, y: 1 },
      { x: -2, y: 1 },
    ],
  },
  inner_rings: [
    {
      vertices: [
        { x: -0.7, y: -0.4 },
        { x: -0.7, y: 0.4 },
        { x: 0.7, y: 0.4 },
        { x: 0.7, y: -0.4 },
      ],
    },
  ],
}

test("pcbsilkscreengraphic preserves precomputed BRep geometry", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <pcbnotetext
        pcbX={0}
        pcbY={4.5}
        text="PRECOMPUTED SILKSCREEN BREP"
        fontSize={0.7}
      />
      <chip
        name="TOP"
        pcbX={-5}
        pcbRotation="20deg"
        noSchematicRepresentation
        footprint={
          <footprint>
            <pcbsilkscreengraphic layer="top" brepShape={brepShape} />
          </footprint>
        }
      />
      <chip
        name="BOTTOM"
        layer="bottom"
        pcbX={5}
        pcbRotation="90deg"
        noSchematicRepresentation
        footprint={
          <footprint>
            <pcbsilkscreengraphic
              layer="top"
              brepShape={brepShape}
              imageAsset={{
                mimetype: "image/svg+xml",
                project_relative_path: "fixtures/logo.svg",
                url: "data:image/svg+xml,%3Csvg/%3E",
              }}
            />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbSilkscreenGraphics = circuit
    .getCircuitJson()
    .filter(
      (element): element is PcbSilkscreenGraphicElement =>
        element.type === "pcb_silkscreen_graphic",
    )

  expect(pcbSilkscreenGraphics).toHaveLength(2)
  expect(pcbSilkscreenGraphics.map((graphic) => graphic.layer)).toEqual([
    "top",
    "bottom",
  ])
  expect(pcbSilkscreenGraphics[0]?.brep_shape.inner_rings).toHaveLength(1)
  expect(pcbSilkscreenGraphics[1]?.image_asset).toMatchObject({
    mimetype: "image/svg+xml",
    project_relative_path: "fixtures/logo.svg",
  })

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
