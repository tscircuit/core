import { expect, test } from "bun:test"
import { assembly, getAssemblyExplosion, jscad } from "lib"
import type { CadComponent, CadReferenceSurface } from "circuit-json"
import { vec3 } from "gl-matrix"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("overlapping targetRefs share one mounted-frame translation and retain pre-move guide anchors", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="FRAME">
      <assembly.part
        name="BASE"
        cadModel={{ jscad: { type: "cuboid", size: [24, 10, 4] } }}
      >
        <assembly.referencesurface
          name="face"
          plane="xz"
          normalDirection="y+"
        />
      </assembly.part>
      <assembly.printedpart
        name="CARRIER"
        mountedTo="BASE.face"
        mountFace="back"
        color="#436f8b"
        jscad={<jscad.cuboid size={[12, 12, 4]} center={[0, 0, 2]} />}
      >
        <assembly.referencesurface name="back" normalDirection="z-" />
        <assembly.referencesurface name="axes" />
        <assembly.subassembly name="OWNER">
          <assembly.subassembly name="MODULE">
            <assembly.part
              name="A"
              cadModel={{
                jscad: { type: "sphere", radius: 3, center: [-5, 0, 8] },
              }}
            >
              <assembly.referencesurface name="tip" centerZOffset="11mm" />
            </assembly.part>
            <assembly.part
              name="B"
              cadModel={{
                jscad: { type: "cuboid", size: [5, 5, 5], center: [5, 0, 8] },
              }}
            />
          </assembly.subassembly>
          <assembly.explosion.stage name="prepare">
            <assembly.explosion.move targetRef="MODULE.A" offZ="4mm" />
          </assembly.explosion.stage>
          <assembly.explosion.stage name="move" prevStageRef="prepare">
            <assembly.explosion.move
              targetRefs={["MODULE", "MODULE.A", "MODULE.A", "MODULE.B"]}
              offX="6mm"
              offY="8mm"
              offZ="10mm"
            />
          </assembly.explosion.stage>
        </assembly.subassembly>
      </assembly.printedpart>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const assembled = structuredClone(circuit.getCircuitJson())
  const prepared = getAssemblyExplosion(circuit, {
    throughStageRef: "FRAME.CARRIER.OWNER.prepare",
  })
  const halfway = getAssemblyExplosion(circuit, {
    throughStageRef: "FRAME.CARRIER.OWNER.move",
    stageProgress: 0.5,
  })
  const findCad = (name: string, json = assembled) => {
    const source = circuit.db.source_component
      .list()
      .find((part) => part.name === name)!
    return json.find(
      (record): record is CadComponent =>
        record.type === "cad_component" &&
        record.source_component_id === source.source_component_id,
    )!
  }
  const carrier = findCad("CARRIER")
  const frame = assembled.find(
    (record): record is CadReferenceSurface =>
      record.type === "cad_reference_surface" &&
      record.source_component_id === carrier.source_component_id &&
      record.name === "axes",
  )!
  const x = [frame.x_axis.x, frame.x_axis.y, frame.x_axis.z] as const
  const z = [frame.normal.x, frame.normal.y, frame.normal.z] as const
  const y = vec3.cross(vec3.create(), z, x)
  const guides = halfway.lines.filter(
    (line) => line.stageRef === "FRAME.CARRIER.OWNER.move",
  )
  expect(guides.map((line) => line.targetRef)).toEqual([
    "MODULE",
    "MODULE.A",
    "MODULE.B",
  ])
  for (const name of ["A", "B"]) {
    const before = findCad(name, prepared.circuitJson).position
    const after = findCad(name, halfway.circuitJson).position
    for (const [axis, coordinate] of ["x", "y", "z"].entries()) {
      const key = coordinate as "x" | "y" | "z"
      expect(after[key] - before[key]).toBeCloseTo(
        3 * x[axis] + 4 * y[axis] + 5 * z[axis],
        4,
      )
    }
    expect(
      guides.find((line) => line.targetRef === `MODULE.${name}`)!.points[0],
    ).toEqual(before)
  }
  // MODULE has no CAD of its own. Its current centroid must include A's prior
  // independent move, and all guides must sample it before this move applies.
  const a = findCad("A", prepared.circuitJson).position
  const b = findCad("B", prepared.circuitJson).position
  expect(guides[0]!.points[0]).toEqual({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
  })
  const surfaceForA = (json: typeof assembled) =>
    json.find(
      (record): record is CadReferenceSurface =>
        record.type === "cad_reference_surface" &&
        record.source_component_id === findCad("A").source_component_id &&
        record.name === "tip",
    )!
  const beforeSurface = surfaceForA(prepared.circuitJson)
  const afterSurface = surfaceForA(halfway.circuitJson)
  const afterA = findCad("A", halfway.circuitJson).position
  for (const coordinate of ["x", "y", "z"] as const) {
    expect(
      afterSurface.center[coordinate] - beforeSurface.center[coordinate],
    ).toBeCloseTo(afterA[coordinate] - a[coordinate], 4)
  }
  expect(afterSurface.normal).toEqual(beforeSurface.normal)
  expect(afterSurface.x_axis).toEqual(beforeSurface.x_axis)
  expect(findCad("CARRIER", halfway.circuitJson)).toEqual(carrier)
  expect(circuit.getCircuitJson()).toEqual(assembled)
  expect(
    getAssemblyExplosion(circuit, {
      throughStageRef: "FRAME.CARRIER.OWNER.prepare",
    }),
  ).toEqual(prepared)
  await expectAssemblySnapshot(import.meta.path, {
    title:
      "Overlapping explosion targets move once in the emitted mounting frame",
    columns: 2,
    panels: [
      {
        title: "Prepare: A moves independently",
        circuit: assembled,
        code: '<assembly.printedpart name="CARRIER"\n  mountedTo="BASE.face" mountFace="back">\n  <assembly.subassembly name="OWNER">\n    <assembly.explosion.stage name="prepare">\n      <assembly.explosion.move\n        targetRef="MODULE.A" offZ="4mm" />\n    </assembly.explosion.stage>\n  </assembly.subassembly>\n</assembly.printedpart>',
        annotation: "The carrier's mounted face points along world +Y.",
        renderOptions: {
          camPos: [45, 35, 45],
          poppygl: {
            lookAt: [0, 7, 0],
          },
          gltf: {
            explosion: { throughStageRef: "FRAME.CARRIER.OWNER.prepare" },
          },
        },
      },
      {
        title: "Half progress: overlapping selections move once",
        circuit: assembled,
        code: '<assembly.explosion.move\n  targetRefs={["MODULE", "MODULE.A",\n    "MODULE.A", "MODULE.B"]}\n  offX="6mm" offY="8mm" offZ="10mm" />\n\ngetAssemblyExplosion(circuit, {\n  throughStageRef:\n    "FRAME.CARRIER.OWNER.move",\n  stageProgress: 0.5,\n})',
        annotation:
          "A and B share one half displacement; duplicate selection adds no motion.",
        renderOptions: {
          camPos: [45, 35, 45],
          poppygl: {
            lookAt: [0, 7, 0],
          },
          gltf: {
            explosion: {
              throughStageRef: "FRAME.CARRIER.OWNER.move",
              stageProgress: 0.5,
            },
          },
        },
      },
    ],
  })
})
