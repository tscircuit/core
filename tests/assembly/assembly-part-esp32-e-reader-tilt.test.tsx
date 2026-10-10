import { expect, test } from "bun:test"
import { createElement } from "react"
import { assembly, jscad } from "lib"
import { convertCircuitJsonToGltf } from "circuit-json-to-gltf"
import {
  computeWorldAABB,
  createSceneFromGLTF,
  loadGLTFWithResourcesFromURL,
} from "poppygl"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("ESP32 e-reader display cushioning inherits the screen's vertical mount", async () => {
  // Unmodified meshes from rushabhcodes/ESP32-E-Reader at
  // 0a773e9fea8862f1dd89bfa23f0e6db5422b5afe, assets/enclosure/display-*.glb.
  const modelUrl = async (name: string) =>
    `data:model/gltf-binary;base64,${Buffer.from(
      await Bun.file(
        new URL(
          `./fixtures/esp32-e-reader-display-${name}.glb`,
          import.meta.url,
        ),
      ).arrayBuffer(),
    ).toString("base64")}`
  const panelUrl = await modelUrl("panel")
  const cushioningUrl = await modelUrl("cushioning")
  const panels = []
  let directBounds: ReturnType<typeof computeWorldAABB> | undefined

  for (const nested of [false, true]) {
    const { circuit } = getTestFixture()
    const cushioning = (
      <assembly.part
        name="DISPLAY_CUSHIONING"
        cadModel={{
          glbUrl: cushioningUrl,
          modelUnitToMmScale: 1,
          // Foam is PCB-relative; move it into the panel's J2-relative frame.
          positionOffset: { x: 0, y: 32.34, z: -0.8 },
        }}
      />
    )
    circuit.add(
      <assembly.device name="ESP32_E_READER">
        <assembly.part name="BASE">
          <assembly.referencesurface
            name="upright"
            plane="xz"
            normalDirection="y-"
            centerZOffset={11}
          />
        </assembly.part>
        <assembly.printedpart
          name="STAND"
          mountedTo="BASE.upright"
          mountFace="back"
          color="#8993a4"
          jscad={<jscad.cuboid size={[68, 111, 3]} center={[0, 42.84, 0.7]} />}
        >
          <assembly.referencesurface name="back" normalDirection="z-" />
          <assembly.part name="MOUNT" />
          {nested ? null : cushioning}
        </assembly.printedpart>
        {createElement(
          assembly.screen,
          {
            name: "EPD1",
            connectsTo: ".MOUNT",
            width: 56.24,
            height: 96.62,
            modelUrl: `${panelUrl}#ext=glb`,
          },
          nested ? (
            <assembly.subassembly name="DISPLAY_MODULE">
              {cushioning}
            </assembly.subassembly>
          ) : null,
        )}
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    const cushioningSource = circuit.db.source_component
      .list()
      .find((source) => source.name === "DISPLAY_CUSHIONING")!
    const glb = await convertCircuitJsonToGltf(
      circuit
        .getCircuitJson()
        .filter(
          (record) =>
            record.type === "source_component" ||
            (record.type === "cad_component" &&
              record.source_component_id ===
                cushioningSource.source_component_id),
        ),
      { format: "glb", includeModels: true },
    )
    const { gltf, resources } = await loadGLTFWithResourcesFromURL(
      `data:model/gltf-binary;base64,${Buffer.from(glb as Uint8Array).toString("base64")}`,
    )
    const scene = createSceneFromGLTF(gltf, resources)
    expect(scene.drawCalls.length).toBeGreaterThan(0)
    const bounds = computeWorldAABB(scene.drawCalls)
    // Renderer XYZ = (-circuit X, circuit Z, circuit Y): upright foam spans
    // the display's height on renderer Y, with only its thickness on Z.
    expect(bounds.max[1] - bounds.min[1]).toBeGreaterThan(90)
    expect(bounds.max[2] - bounds.min[2]).toBeLessThan(2)
    if (!nested) directBounds = bounds
    else
      for (const corner of ["min", "max"] as const)
        for (const axis of [0, 1, 2])
          expect(bounds[corner][axis]).toBeCloseTo(
            directBounds![corner][axis],
            3,
          )

    panels.push({
      title: nested ? "Inherited through screen" : "Direct vertical mount",
      code: nested
        ? '<assembly.screen name="EPD1"\n  connectsTo=".MOUNT">\n  <assembly.subassembly name="DISPLAY_MODULE">\n    <assembly.part name="DISPLAY_CUSHIONING"\n      cadModel={displayCushioning} />\n  </assembly.subassembly>\n</assembly.screen>'
        : '<assembly.printedpart name="STAND"\n  mountedTo="BASE.upright" mountFace="back">\n  <assembly.part name="DISPLAY_CUSHIONING"\n    cadModel={displayCushioning} />\n</assembly.printedpart>',
      annotation:
        "E-reader panel and cushioning retain the same vertical pose.",
      circuit,
      renderOptions: {
        camPos: [130, 100, 190] as [number, number, number],
        poppygl: { lookAt: [0, 66, 0] as [number, number, number] },
      },
    })
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "ESP32 e-reader: display cushioning stays upright through a screen",
    panels,
    columns: 2,
  })
}, 60000)
