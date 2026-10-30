import { expect, test } from "bun:test"
import { Circuit, assembly, getAssemblyExplosion } from "lib"
import { any_circuit_element } from "circuit-json"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("continuous explosion checks catch a thin obstacle between clear endpoints", async () => {
  const circuit = new Circuit()
  circuit.add(
    <assembly.device name="SWEEP">
      <assembly.printedpart
        name="SLIDER"
        color="#3283b5"
        cadModel={{
          jscad: { type: "cuboid", size: [1, 2, 2] },
          positionOffset: { x: -10, y: 0, z: 0 },
        }}
      />
      <assembly.printedpart
        name="WALL"
        color="#d49438"
        cadModel={{
          jscad: { type: "cuboid", size: [0.01, 8, 8] },
          positionOffset: { x: 0.017, y: 0, z: 0 },
        }}
      />
      <assembly.explosion.stage name="slide">
        <assembly.explosion.move targetRef="SLIDER" offX={20} />
      </assembly.explosion.stage>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  // Diagnostics must exist in the DB before any view/getCircuitJson call.
  const errors = circuit.db.cad_explosion_collision_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]).toMatchObject({
    cad_explosion_stage_id:
      circuit.db.cad_explosion_stage.list()[0].cad_explosion_stage_id,
    cad_explosion_move_id:
      circuit.db.cad_explosion_move.list()[0].cad_explosion_move_id,
    moving_cad_component_id: circuit.selectOne(".SLIDER")!.cad_component_id,
    obstacle: {
      type: "cad_component",
      cad_component_id: circuit.selectOne(".WALL")!.cad_component_id,
    },
  })
  expect(errors[0].swept_intersection_volume_mm3).toBeCloseTo(0.04, 5)
  expect(errors[0].message).toBe(
    'Explosion stage "SWEEP.slide" moves "SLIDER" through "WALL"',
  )
  expect(any_circuit_element.parse(errors[0])).toEqual(errors[0])
  expect(circuit.db.cad_explosion_collision_check_warning.list()).toHaveLength(
    0,
  )
  expect(getAssemblyExplosion(circuit).collisionCheckStatus).toBe("checked")
  const assembled = structuredClone(circuit.getCircuitJson())
  await circuit.renderUntilSettled()
  expect(circuit.getCircuitJson()).toEqual(assembled)
  await expectAssemblySnapshot(import.meta.path, {
    title: "Continuous collision: a 0.01 mm wall between clear endpoints",
    columns: 1,
    panels: [
      {
        title: "1. Start: clear",
        code: '<assembly.part name="SLIDER"\n  cadModel={{ jscad: { type: "cuboid",\n    size: [1, 2, 2] },\n    positionOffset: { x: -10, y: 0, z: 0 } }} />',
        annotation:
          "The blue slider starts at X=-10 mm, clear of the thin amber wall.",
        progress: 0,
      },
      {
        title: "2. Mid-path: collision detected",
        code: '<assembly.explosion.stage name="slide">\n  <assembly.explosion.move\n    targetRef="SLIDER" offX={20} />\n</assembly.explosion.stage>',
        annotation:
          "The sweep intersects the wall even though both endpoint poses are clear.",
        progress: 0.50085,
      },
      {
        title: "3. End: clear, collision diagnostic retained",
        code: "cad_explosion_collision_error\n  moving: SLIDER\n  obstacle: WALL\n  swept_intersection_volume_mm3: 0.04",
        annotation:
          "The error belongs to the movement; evaluating only the final pose would miss it.",
        progress: 1,
      },
    ].map(({ progress, ...panel }) => ({
      ...panel,
      circuit: assembled,
      renderOptions: {
        camPos: [-22, 16, 28],
        poppygl: { lookAt: [0, 0, 0] },
        gltf: {
          explosion: {
            throughStageRef: "SWEEP.slide",
            stageProgress: progress,
          },
        },
      },
    })),
  })
})
