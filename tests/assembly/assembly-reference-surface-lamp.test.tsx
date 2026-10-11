import { expect, test } from "bun:test"
import modeling from "@jscad/modeling"
import { executeJscadOperations, type JscadOperation } from "jscad-planner"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ReferenceSurfaceLamp } from "./fixtures/reference-surface-lamp"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("child reference surfaces seat a hollow printed lampshade on a stem and lift it for assembly", async () => {
  const circuits = []
  for (const shadeGap of [0, 60]) {
    const { circuit } = getTestFixture()
    circuit.add(<ReferenceSurfaceLamp shadeGap={shadeGap} />)
    await circuit.renderUntilSettled()
    circuits.push(circuit)
    expect(circuit.db.cad_component.list()).toHaveLength(4)
    expect(circuit.db.cad_reference_surface.list()).toHaveLength(4)
    expect(circuit.db.pcb_component.list()).toHaveLength(0)
    for (const [name, bottom, top] of [
      ["BASE", 0, 12],
      ["STEM", 12, 92],
      ["SHADE", 68 + shadeGap, 112 + shadeGap],
      ["BULB", 92, 107],
    ] as const) {
      const source = circuit.db.source_component
        .list()
        .find((s) => s.name === name)!
      const cad = circuit.db.cad_component
        .list()
        .find((c) => c.source_component_id === source.source_component_id)!
      const geometry = executeJscadOperations(
        modeling as any,
        cad.model_jscad as JscadOperation,
      )
      const bounds = modeling.measurements.measureBoundingBox(geometry)
      expect(bounds[0][2] + cad.position.z).toBeCloseTo(bottom, 4)
      expect(bounds[1][2] + cad.position.z).toBeCloseTo(top, 4)
      if (name === "SHADE") {
        expect(cad.position.z).toBeCloseTo(92 + shadeGap)
        const volume = modeling.measurements.measureVolume(geometry)
        expect(volume).toBeGreaterThan(5000)
        expect(volume).toBeLessThan(25000)
        expect(source).toMatchObject({ material: "pla", color: "#d9a15f" })
      }
    }
  }
  const shadeSource = circuits[0].db.source_component
    .list()
    .find((s) => s.name === "SHADE")!
  const shadeCad = circuits[0].db.cad_component
    .list()
    .find((c) => c.source_component_id === shadeSource.source_component_id)!
  await expectAssemblySnapshot(import.meta.path, {
    title: "A printed lampshade mounts to a lamp on its base",
    panels: [
      {
        title: "Assembled: shade collar seats on the 80 mm stem",
        code: '<assembly.part name="BASE"\n  cadModel={{ jscad: lampBase }}>\n  <assembly.referencesurface name="stem"\n    centerZOffset="12mm" />\n</assembly.part>\n<assembly.printedpart name="STEM"\n  jscad={<LampStem />}\n  mountedTo="BASE.stem" mountFace="base">\n  <assembly.referencesurface name="base"\n    normalDirection="z-" />\n  <assembly.referencesurface name="shade"\n    centerZOffset="80mm" />\n</assembly.printedpart>',
        annotation:
          "BASE.stem -> STEM.base; STEM.shade -> SHADE.stem. The shade seats at Z=92 mm.",
        circuit: circuits[0],
        renderOptions: {
          camPos: [150, 115, 175],
          poppygl: { lookAt: [0, 62, 0] },
        },
      },
      {
        title: "Assembly view: mounting frames and outward normals",
        showReferenceSurfaces: true,
        code: '<assembly.printedpart name="SHADE"\n  jscad={<LampShade />} material="pla"\n  mountedTo="STEM.shade" mountFace="stem"\n  mountGap="60mm">\n  <assembly.referencesurface name="stem"\n    normalDirection="z-" />\n</assembly.printedpart>\n\n// LampShade: hollow tapered shell,\n// mounting collar, and three spokes.\n// LampStem: a hollow wiring channel.\n// convertCircuitJsonToGltf(json, {\n//   showReferenceSurfaces: true\n// })',
        annotation:
          "Cyan: named reference rectangles. Orange: normals. mountGap lifts the shade 60 mm.",
        circuit: circuits[1],
        renderOptions: {
          camPos: [184, 120, 219],
          poppygl: { lookAt: [0, 86, 0] },
        },
      },
      {
        title: "Shade underside: inspect the collar's downward mounting frame",
        code: '<assembly.printedpart name="SHADE"\n  jscad={<LampShade />}\n  mountedTo="STEM.shade" mountFace="stem">\n  <assembly.referencesurface name="stem"\n    normalDirection="z-"\n    width="28mm" height="28mm"\n    centerZOffset="0mm" />\n</assembly.printedpart>\n\n// Collar at local Z=0..4 mm.\n// Hollow shell at local Z=-24..20 mm.\n// Three spokes connect collar to shell.',
        annotation:
          "The cyan frame surrounds the collar. Its orange arrow points down, toward the stem.",
        showReferenceSurfaces: true,
        circuit: [
          shadeSource,
          shadeCad,
          ...circuits[0].db.cad_reference_surface
            .list()
            .filter(
              (s) => s.source_component_id === shadeSource.source_component_id,
            ),
        ],
        renderOptions: {
          camPos: [55, 12, 70],
          poppygl: { lookAt: [0, 92, 0] },
        },
      },
    ],
  })
})
