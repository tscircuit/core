import { expect, test } from "bun:test"
import { checkCircuitJsonAssemblyExplosionCollisions } from "lib"
import { loadRp2040ExplosionFixture } from "./fixtures/rp2040-explosion/load-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("the real RP2040 TSX export detects a cover driven through the PCB and reports missing model coverage", async () => {
  // This is the pinned output of fixtures/rp2040-explosion/assembly.source.tsx,
  // including the routed board, NEMA17, bored spacers, cover and socket bolts.
  const assembled = await loadRp2040ExplosionFixture()
  const original = JSON.stringify(assembled)
  const clear = await checkCircuitJsonAssemblyExplosionCollisions(assembled)
  expect(clear.errors).toHaveLength(0)
  expect(clear.status).toBe("incomplete")
  const warning = clear.warnings.find(
    (w) => w.reason === "unsupported_geometry",
  )!
  const importedModels = assembled.filter(
    (r) => r.type === "cad_component" && (r.model_obj_url || r.model_glb_url),
  )
  // 40 imported meshes plus 72 footprint-only CAD records have no JSCAD solid.
  expect(warning.cad_component_ids).toHaveLength(112)
  for (const model of importedModels) {
    if (model.type === "cad_component")
      expect(warning.cad_component_ids).toContain(model.cad_component_id)
  }
  expect(warning.pcb_board_ids).toEqual([])
  expect(warning.message.length).toBeLessThan(300)

  const reversed = structuredClone(assembled)
  const lift = reversed.find(
    (r) =>
      r.type === "cad_explosion_stage" && r.name === "RP2040_NEMA17.lift-cover",
  )!
  if (lift.type !== "cad_explosion_stage") throw new Error("Missing lift stage")
  const move = reversed.find(
    (r) =>
      r.type === "cad_explosion_move" &&
      r.cad_explosion_stage_id === lift.cad_explosion_stage_id,
  )!
  if (move.type !== "cad_explosion_move") throw new Error("Missing lift move")
  move.translation.z = -24
  const blocked = await checkCircuitJsonAssemblyExplosionCollisions(reversed)
  const pcbCollision = blocked.errors.find(
    (e) => e.obstacle.type === "pcb_board",
  )!
  expect(pcbCollision).toMatchObject({
    cad_explosion_stage_id: lift.cad_explosion_stage_id,
    cad_explosion_move_id: move.cad_explosion_move_id,
  })
  expect(pcbCollision.swept_intersection_volume_mm3).toBeGreaterThan(2000)
  expect(pcbCollision.message).toContain('moves "cover" through "PCB"')
  expect(pcbCollision.message).toContain("new swept intersection: 2132.7 mm³")
  // Unsupported motor/bolt/component meshes never turn partial coverage into a pass.
  expect(blocked.status).toBe("incomplete")
  expect(blocked.warnings[0].cad_component_ids).toEqual(
    warning.cad_component_ids,
  )
  expect(JSON.stringify(assembled)).toBe(original)
  // This image shows the lift only. Later spacer movements must not color
  // stationary spacers as moving collision parts in this earlier stage.
  const liftCheck = {
    ...blocked,
    errors: blocked.errors.filter(
      (error) => error.cad_explosion_stage_id === lift.cad_explosion_stage_id,
    ),
  }
  expect(liftCheck.errors).toHaveLength(5)
  expect(
    liftCheck.errors.every(
      (error) =>
        error.moving_cad_component_id === pcbCollision.moving_cad_component_id,
    ),
  ).toBe(true)

  await expectAssemblySnapshot(import.meta.path, {
    title: "RP2040 assembly: lift clear, or drive the cover through the board",
    panels: [
      {
        title: "1. Lift the real cover and bolts",
        code: '<assembly.explosion.stage\n  name="lift-cover">\n  <assembly.explosion.move\n    targetRefs={[\n      "cover", "remove-bolts"\n    ]}\n    offZ={24} />\n</assembly.explosion.stage>',
        annotation:
          "Cover, spacers and PCB checked. Bolt-to-motor fit is NOT checked in this assembly.",
        circuit: assembled,
        collisionCheck: clear,
        progress: 1,
      },
      {
        title: "2. Cover driven DOWN through the PCB and spacers",
        code: '<assembly.explosion.stage\n  name="lift-cover">\n  <assembly.explosion.move\n    targetRefs={[\n      "cover", "remove-bolts"\n    ]}\n    offZ={-24} />\n</assembly.explosion.stage>',
        annotation:
          "RED = moving cover crossing the green PCB and stationary spacers; bolt/motor meshes unchecked.",
        circuit: reversed,
        collisionCheck: liftCheck,
        progress: 5 / 6,
      },
    ].map(({ progress, ...panel }) => ({
      ...panel,
      collisionNote: "Bolt / motor fit: NOT CHECKED",
      renderOptions: {
        camPos: progress === 1 ? [-100, 90, 110] : [-70, 22, 70],
        fov: progress === 1 ? 40 : 32,
        poppygl: { lookAt: progress === 1 ? [0, 8, 0] : [0, 0, 0] },
        gltf: {
          explosion: {
            throughStageRef: "RP2040_NEMA17.lift-cover",
            stageProgress: progress,
          },
        },
      },
    })),
  })
})
