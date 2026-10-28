import { expect, test } from "bun:test"
import { getAssemblyExplosion } from "lib"
import type { CadComponent } from "circuit-json"
import { convertCircuitJsonToGltf } from "circuit-json-to-gltf"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ExplosionLamp } from "./fixtures/explosion-lamp"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { poppyglExplosionLines } from "./fixtures/poppygl-explosion-lines"

test("constraint-mounted cover moves intact before its nested cap explodes", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<ExplosionLamp />)
  await circuit.renderUntilSettled()
  const assembled = structuredClone(circuit.getCircuitJson())
  const initial = getAssemblyExplosion(circuit, {
    throughStageRef: "LAMP.lift-cover",
    stageProgress: 0,
  })
  const lifted = getAssemblyExplosion(circuit, {
    throughStageRef: "LAMP.lift-cover",
  })
  const parked = getAssemblyExplosion(circuit, {
    throughStageRef: "LAMP.park-cover",
  })
  const exploded = getAssemblyExplosion(circuit)
  expect(exploded.stages).toEqual([
    "LAMP.lift-cover",
    "LAMP.park-cover",
    "LAMP.STEM.COVER.remove-cap",
  ])
  const cadFor = (json: typeof assembled, name: string) => {
    const source = circuit.db.source_component
      .list()
      .find((part) => part.name === name)!
    return json.find(
      (cad): cad is CadComponent =>
        cad.type === "cad_component" &&
        cad.source_component_id === source.source_component_id,
    )!
  }
  expect(cadFor(assembled, "SHADE").position.z).toBeCloseTo(92)
  expect(cadFor(assembled, "CAP").position.z).toBeCloseTo(112)
  for (const name of ["SHADE", "CAP"]) {
    expect(
      cadFor(lifted.circuitJson, name).position.z -
        cadFor(assembled, name).position.z,
    ).toBeCloseTo(50)
    expect(
      cadFor(parked.circuitJson, name).position.x -
        cadFor(assembled, name).position.x,
    ).toBeCloseTo(85)
  }
  expect(cadFor(exploded.circuitJson, "CAP").position.z).toBeCloseTo(186)
  expect(cadFor(exploded.circuitJson, "SHADE").position.z).toBeCloseTo(142)
  expect(cadFor(exploded.circuitJson, "BULB")).toEqual(
    cadFor(assembled, "BULB"),
  )
  expect(initial.circuitJson).toEqual(
    assembled.filter(
      (record) =>
        record.type !== "cad_explosion_stage" &&
        record.type !== "cad_explosion_move",
    ),
  )
  expect(circuit.getCircuitJson()).toEqual(assembled)
  expect(getAssemblyExplosion(circuit)).toEqual(exploded)
  expect(exploded.collisionCheckStatus).toBe("not_implemented")
  const capSurface = exploded.circuitJson.find(
    (record): record is import("circuit-json").CadReferenceSurface =>
      record.type === "cad_reference_surface" &&
      record.source_component_id ===
        cadFor(assembled, "CAP").source_component_id,
  )!
  expect(capSurface.center.x).toBeCloseTo(85)
  expect(capSurface.center.y).toBeCloseTo(0)
  expect(capSurface.center.z).toBeCloseTo(186)
  expect(capSurface.normal.z).toBeCloseTo(-1)
  // Measure the exporter boundary from actual emitted glTF, not a restatement
  // of core's frame math. The cap's guide endpoint must meet its rendered origin.
  const gltf = (await convertCircuitJsonToGltf(exploded.circuitJson, {
    format: "gltf",
    includeModels: true,
  })) as { nodes: { name?: string; translation?: number[] }[] }
  const capNode = gltf.nodes.find((node) => node.name === "CAP")!
  const capGuideEnd = poppyglExplosionLines(exploded).at(-1)!.points.at(-1)!
  for (const axis of [0, 1, 2])
    expect(capGuideEnd[axis]).toBeCloseTo(capNode.translation![axis])
  await expectAssemblySnapshot(import.meta.path, {
    title:
      "Speculative assembly explosion: constrained mounts, then staged motion",
    columns: 2,
    panels: [
      {
        title: "1. Assembled: reference faces constrain placement",
        circuit: initial.circuitJson,
        code: '<assembly.printedpart name="SHADE"\n  mountedTo="STEM.shade" mountFace="stem"\n  jscad={<LampShade />}>\n  <assembly.referencesurface name="cap"\n    centerZOffset="20mm" />\n</assembly.printedpart>\n<assembly.printedpart name="CAP"\n  mountedTo="SHADE.cap"\n  mountFace="bottom" ... />',
        annotation:
          "Mounts resolve SHADE at Z=92 mm and CAP at Z=112 mm; no explosion offsets yet.",
        renderOptions: {
          camPos: [150, 115, 175],
          poppygl: { lookAt: [0, 65, 0] },
        },
      },
      {
        title: "2. Lift the intact cover subassembly",
        circuit: lifted.circuitJson,
        code: '<assembly.explosion.stage name="lift-cover">\n  <assembly.explosion.move\n    targetRef="STEM.COVER" offZ="50mm" />\n</assembly.explosion.stage>',
        annotation:
          "SHADE and CAP move together; BASE, STEM and BULB stay assembled.",
        renderOptions: {
          camPos: [180, 140, 200],
          poppygl: {
            lookAt: [0, 90, 0],
            explosionLines: poppyglExplosionLines(lifted),
          },
        },
      },
      {
        title: "3. Park the intact cover beside the lamp",
        circuit: parked.circuitJson,
        code: '<assembly.explosion.stage name="park-cover"\n  nextStageRef="STEM.COVER.remove-cap">\n  <assembly.explosion.move\n    targetRef="STEM.COVER" offX="85mm" />\n</assembly.explosion.stage>',
        annotation:
          "The declared lift-then-slide path forms an elbow; removed parts remain visible.",
        renderOptions: {
          camPos: [240, 170, 250],
          poppygl: {
            lookAt: [-40, 90, 0],
            explosionLines: poppyglExplosionLines(parked),
          },
        },
      },
      {
        title: "4. Explode the cap in the displaced cover frame",
        circuit: exploded.circuitJson,
        code: '<assembly.subassembly name="COVER">\n  ...\n  <assembly.explosion.stage name="remove-cap">\n    <assembly.explosion.move\n      targetRef="CAP" offZ="24mm" />\n  </assembly.explosion.stage>\n</assembly.subassembly>',
        annotation:
          "CAP lifts separately to Z=186 mm. Rendering does not certify collision clearance.",
        renderOptions: {
          camPos: [240, 180, 250],
          poppygl: {
            lookAt: [-40, 100, 0],
            explosionLines: poppyglExplosionLines(exploded),
          },
        },
      },
    ],
  })
})
