import { poppyglExplosionLines } from "./fixtures/poppygl-explosion-lines"
import { getAssemblyExplosionFrames } from "circuit-json-to-gltf"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { expect, test } from "bun:test"
import {
  Circuit,
  assembly,
  getAssemblyExplosion,
  getCircuitJsonAssemblyExplosion,
} from "lib"
import type { CadComponent, CadExplosionMove } from "circuit-json"

test("TSX exports ordered movements and whole-stage targets that survive JSON-only playback", async () => {
  const circuit = new Circuit()
  circuit.add(
    <assembly.device name="DEVICE">
      <assembly.part name="COVER">
        <assembly.part
          name="SHELL"
          cadModel={{
            jscad: {
              type: "colorize",
              color: [0.2, 0.5, 0.7],
              shape: { type: "cuboid", size: [12, 9, 3] },
            },
          }}
        />
        <assembly.part
          name="WINDOW"
          cadModel={{
            jscad: {
              type: "colorize",
              color: [0.95, 0.65, 0.2],
              shape: { type: "cuboid", size: [8, 5, 1], center: [0, 0, 2] },
            },
          }}
        />
        <assembly.referencesurface name="origin" />
      </assembly.part>
      <assembly.explosion.stage name="lift">
        <assembly.explosion.move targetRef="COVER" offZ="10mm" />
        <assembly.explosion.move targetRef="COVER.WINDOW" offZ="4mm" />
      </assembly.explosion.stage>
      <assembly.explosion.stage name="park" prevStageRef="lift">
        <assembly.explosion.move
          targetRefs={["lift", "COVER.WINDOW"]}
          offX="20mm"
        />
      </assembly.explosion.stage>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const assembled = circuit.getCircuitJson()
  expect(circuit.getCircuitJson()).toEqual(assembled)
  const json = JSON.parse(JSON.stringify(assembled)).reverse()
  const stages = json.filter(
    (record: any) => record.type === "cad_explosion_stage",
  )
  expect(stages).toHaveLength(2)
  expect(stages[0].cad_component_ids).toHaveLength(2)
  expect(stages[0].cad_reference_surface_ids).toHaveLength(1)
  const moves = json.filter(
    (record: any) => record.type === "cad_explosion_move",
  ) as CadExplosionMove[]
  expect(moves).toHaveLength(3)
  expect(moves[0].targets[0].type).toBe("cad_explosion_stage")
  const original = structuredClone(json)
  const full = getCircuitJsonAssemblyExplosion(json)
  const halfway = getCircuitJsonAssemblyExplosion(json, {
    throughStageRef: "DEVICE.park",
    stageProgress: 0.5,
  })
  const firstQuarter = getCircuitJsonAssemblyExplosion(json, {
    throughStageRef: "DEVICE.lift",
    stageProgress: 0.25,
  })
  for (const component of assembled.filter(
    (record): record is CadComponent => record.type === "cad_component",
  )) {
    const source = assembled.find(
      (record) =>
        record.type === "source_component" &&
        record.source_component_id === component.source_component_id,
    ) as any
    const position = (view: typeof full) =>
      (
        view.circuitJson.find(
          (record) =>
            record.type === "cad_component" &&
            record.cad_component_id === component.cad_component_id,
        ) as CadComponent
      ).position
    expect(position(full)).toEqual({
      x: component.position.x + 20,
      y: component.position.y,
      z: component.position.z + (source.name === "WINDOW" ? 14 : 10),
    })
    expect(position(halfway).x).toBe(component.position.x + 10)
    expect(position(firstQuarter).z).toBe(component.position.z + 5)
  }
  const surface = full.circuitJson.find(
    (record) => record.type === "cad_reference_surface",
  ) as any
  expect(surface.center).toEqual({ x: 20, y: 0, z: 10 })
  expect(getAssemblyExplosion(circuit).circuitJson).toEqual(
    getCircuitJsonAssemblyExplosion(assembled).circuitJson,
  )
  expect(getCircuitJsonAssemblyExplosion(json).circuitJson).toEqual(
    full.circuitJson,
  )
  expect(getCircuitJsonAssemblyExplosion(full.circuitJson).stages).toEqual([])
  expect(getCircuitJsonAssemblyExplosion(full.circuitJson).circuitJson).toEqual(
    full.circuitJson,
  )
  expect(json).toEqual(original)
  // Native exporter playback consumes the original JSON, including stage targets.
  // Compare its independently evaluated frame with core's evaluator as well.
  const frames = getAssemblyExplosionFrames(json)
  expect(frames.at(-1)!.circuitJson).toEqual(full.circuitJson)
  const poses = [
    {
      title: "0. Assembled cover",
      code: "getAssemblyExplosionFrames(json)[0]",
      annotation: "Blue shell and amber window share a model-less COVER owner.",
      explosion: undefined,
    },
    {
      title: "1. Lift: first move halfway",
      code: `explosion: {
  throughStageRef: "DEVICE.lift",
  stageProgress: 0.25
}`,
      annotation:
        "The first of two sequential moves lifts the intact cover 5 mm.",
      explosion: { throughStageRef: "DEVICE.lift", stageProgress: 0.25 },
    },
    {
      title: "2. Lift complete",
      code: `targetRef="COVER" offZ="10mm"
targetRef="COVER.WINDOW" offZ="4mm"`,
      annotation: "Shell rises 10 mm; the window then rises another 4 mm.",
      explosion: frames[1]!.explosion,
    },
    {
      title: "3. Park: whole stage halfway",
      code: `targetRefs={["lift", "COVER.WINDOW"]}
offX="20mm"
stageProgress: 0.5`,
      annotation:
        "Both move X=10 mm. The overlapping window target moves only once.",
      explosion: { throughStageRef: "DEVICE.park", stageProgress: 0.5 },
    },
    {
      title: "4. Park complete",
      code: `explosion: {
  throughStageRef: "DEVICE.park"
}`,
      annotation:
        "Both reach X=20 mm while retaining their different lift heights.",
      explosion: frames[2]!.explosion,
    },
    {
      title: "5. Scrub backward to lift",
      code: `explosion: {
  throughStageRef: "DEVICE.lift"
}`,
      annotation:
        "Re-evaluate assembled JSON: the sideways translation disappears.",
      explosion: frames[1]!.explosion,
    },
  ]
  await expectAssemblySnapshot(import.meta.path, {
    title:
      "Serialized explosion playback: sequential moves and whole-stage overlap",
    columns: 2,
    font: "alphabet",
    panels: poses.map((pose) => ({
      ...pose,
      circuit: json,
      renderOptions: {
        camPos: [-35, 28, 40],
        poppygl: {
          lookAt: [-10, 7, 0],
          explosionLines: pose.explosion
            ? poppyglExplosionLines(
                getCircuitJsonAssemblyExplosion(json, pose.explosion),
              )
            : [],
        },
        gltf: { explosion: pose.explosion },
      },
    })),
  })
})
