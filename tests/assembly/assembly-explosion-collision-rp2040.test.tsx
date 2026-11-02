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
  // Unsupported motor/bolt/component meshes never turn partial coverage into a pass.
  expect(blocked.status).toBe("incomplete")
  expect(blocked.warnings[0].cad_component_ids).toEqual(
    warning.cad_component_ids,
  )
  expect(JSON.stringify(assembled)).toBe(original)

  await expectAssemblySnapshot(import.meta.path, {
    title: "RP2040 assembly: lift clear, or drive the cover through the board",
    panels: [
      {
        title: "1. Lift the real cover and bolts",
        code: '<assembly.explosion.stage\n  name="lift-cover">\n  <assembly.explosion.move\n    targetRefs={[\n      "cover", "remove-bolts"\n    ]}\n    offZ={24} />\n</assembly.explosion.stage>',
        annotation:
          "No collision in the checked cover, spacers and PCB. The whole assembly is not verified.",
        circuit: assembled,
        collisionCheck: clear,
        progress: 1,
      },
      {
        title: "2. Reversed lift: cover intersects the PCB",
        code: '<assembly.explosion.stage\n  name="lift-cover">\n  <assembly.explosion.move\n    targetRefs={[\n      "cover", "remove-bolts"\n    ]}\n    offZ={-24} />\n</assembly.explosion.stage>',
        annotation:
          "RED = diagnosed colliding cover, shown translucent where it passes through the PCB.",
        circuit: reversed,
        collisionCheck: blocked,
        progress: 0.8,
      },
    ].map(({ progress, ...panel }) => ({
      ...panel,
      renderOptions: {
        camPos: [-100, 90, 110],
        poppygl: { lookAt: [0, 8, 0] },
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
