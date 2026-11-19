import { expect, test } from "bun:test"
import { cad_sticker } from "circuit-json"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import labelSvg from "./fixtures/sticker-label.svg" with { type: "text" }

test("a sticker on a printed part's top surface becomes a cad_sticker with its own BOM line", async () => {
  const { circuit } = getTestFixture()
  const labelUrl = `data:image/svg+xml,${encodeURIComponent(labelSvg)}`
  circuit.add(
    <assembly.device>
      <assembly.printedpart
        name="LID"
        jscad={<jscad.cuboid size={[45.5, 45.5, 12]} center={[0, 0, 6]} />}
      >
        <assembly.sticker
          name="LABEL"
          displayName="Product label"
          imageUrl={labelUrl}
          surfaceRef="topSurface"
          width="38.1mm"
          height="19.05mm"
          cornerRadius="1.5mm"
          thickness="0.1mm"
          backgroundColor="#ffffff"
          purchaseUrls={["https://example.com/labels"]}
        />
      </assembly.printedpart>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()

  const sources = circuit.db.source_component.list()
  const lid = sources.find((source) => source.name === "LID")!
  const label = sources.find((source) => source.name === "LABEL")!
  expect(label).toMatchObject({
    ftype: "sticker",
    display_name: "Product label",
  })

  const stickers = circuit
    .getCircuitJson()
    .filter((element) => element.type === "cad_sticker")
  expect(stickers).toHaveLength(1)
  // The lid's top is the Z=12 face of its bounds, centered on the part origin.
  expect(cad_sticker.parse(stickers[0])).toEqual({
    type: "cad_sticker",
    cad_sticker_id: "cad_sticker_0",
    source_component_id: label.source_component_id,
    applied_to_source_component_id: lid.source_component_id,
    center: { x: 0, y: 0, z: 12 },
    normal_direction: { x: 0, y: 0, z: 1 },
    x_axis_direction: { x: 1, y: 0, z: 0 },
    width: 38.1,
    height: 19.05,
    corner_radius: 1.5,
    thickness: 0.1,
    background_color: "#ffffff",
    image_asset: {
      project_relative_path: "inline",
      url: labelUrl,
      mimetype: "image/svg+xml",
    },
  })

  const bom = circuit.db.cad_assembly_bom_item.list()
  const lidLine = bom.find(
    (item) => item.source_component_id === lid.source_component_id,
  )!
  expect(
    bom.find((item) => item.source_component_id === label.source_component_id),
  ).toMatchObject({
    name: "Product label",
    quantity: 1,
    parent_cad_assembly_bom_item_id: lidLine.cad_assembly_bom_item_id,
    purchase_urls: ["https://example.com/labels"],
  })

  await expectAssemblySnapshot(import.meta.path, {
    title: "A sticker on a printed lid",
    layout: "model_focus",
    panels: [
      {
        title: "Product label on the lid's top surface",
        code: `<assembly.printedpart name="LID"
  jscad={<Lid />}>
  <assembly.sticker name="LABEL"
    imageUrl="./label.svg"
    surfaceRef="topSurface"
    width="38.1mm" height="19.05mm"
    cornerRadius="1.5mm" />
</assembly.printedpart>`,
        annotation:
          "38.1 x 19.05 mm label centered on the lid's 45.5 mm square top, at Z=12 mm",
        circuit,
        // glTF scene mm, +Y up: look down at the lid from its front.
        renderOptions: { camPos: [34, 58, -62] },
      },
    ],
  })
})
