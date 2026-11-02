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
  const sources = new Map(
    assembled
      .filter((r) => r.type === "source_component")
      .map((r) => [r.source_component_id, r.name]),
  )
  const names = new Map(
    assembled
      .filter((r) => r.type === "cad_component")
      .map((r) => [r.cad_component_id, sources.get(r.source_component_id)]),
  )
  expect(clear.status).toBe("incomplete")
  const unchecked = clear.warnings.flatMap((w) => w.cad_component_ids)
  expect(unchecked.map((id) => names.get(id)).sort()).toEqual([
    "F_MOTOR_VBUS",
    "J_MOTOR_USB",
    "J_USB",
    "L_AVDD",
    "U_TEMP",
  ])
  expect(
    assembled.filter((r) => r.type === "cad_component").length -
      unchecked.length,
  ).toBe(112)
  expect(clear.errors).toHaveLength(4)
  for (const error of clear.errors) {
    expect(names.get(error.moving_cad_component_id)).toBe("motor")
    expect(error.message).toContain("separate-motor")
    expect(error.swept_intersection_volume_mm3).toBeCloseTo(0.336855, 4)
  }
  expect(
    clear.errors
      .map((e) =>
        e.obstacle.type === "cad_component"
          ? names.get(e.obstacle.cad_component_id)
          : "PCB",
      )
      .sort(),
  ).toEqual(["spacer1", "spacer2", "spacer3", "spacer4"])
  for (const warning of clear.warnings) {
    expect(warning.pcb_board_ids).toEqual([])
    expect(warning.message.length).toBeLessThan(300)
  }

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
  // Unusable electronics meshes never turn partial coverage into a pass.
  expect(blocked.status).toBe("incomplete")
  expect(blocked.warnings.flatMap((w) => w.cad_component_ids)).toEqual(
    unchecked,
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
  expect(liftCheck.errors).toHaveLength(107)
  expect(
    new Set(liftCheck.errors.map((e) => names.get(e.moving_cad_component_id))),
  ).toEqual(new Set(["cover", "bolt1", "bolt2", "bolt3", "bolt4"]))
  const clearLift = {
    ...clear,
    errors: clear.errors.filter(
      (e) => e.cad_explosion_stage_id === lift.cad_explosion_stage_id,
    ),
  }
  expect(clearLift.errors).toEqual([])

  await expectAssemblySnapshot(import.meta.path, {
    title: "RP2040 assembly: lift clear, or drive the cover through the board",
    panels: [
      {
        title: "1. Lift the real cover and bolts",
        code: '<assembly.explosion.stage\n  name="lift-cover">\n  <assembly.explosion.move\n    targetRefs={[\n      "cover", "remove-bolts"\n    ]}\n    offZ={24} />\n</assembly.explosion.stage>',
        annotation:
          "This lift is clear in checked geometry. Motor removal has separate collisions (below).",
        circuit: assembled,
        collisionCheck: clearLift,
        progress: 1,
      },
      {
        title: "2. Cover driven DOWN through the PCB and spacers",
        code: '<assembly.explosion.stage\n  name="lift-cover">\n  <assembly.explosion.move\n    targetRefs={[\n      "cover", "remove-bolts"\n    ]}\n    offZ={-24} />\n</assembly.explosion.stage>',
        annotation:
          "RED = moving cover and bolt heads crossing the PCB, motor and electronics.",
        circuit: reversed,
        collisionCheck: liftCheck,
        progress: 5 / 6,
      },
      {
        title: "3. Motor removal: existing rear screw / spacer overlap worsens",
        code: '<assembly.explosion.stage\n  name="separate-motor">\n  <assembly.explosion.move\n    targetRef="motor"\n    offZ={-24} />\n</assembly.explosion.stage>',
        annotation:
          "Rear screw heads already overlap spacers; only newly entered material is reported.",
        circuit: assembled,
        collisionCheck: clear,
        progress: 0.02,
      },
    ].map(({ progress, ...panel }) => ({
      ...panel,
      collisionNote: "112 / 117 CAD models + PCB checked",
      renderOptions: {
        camPos:
          progress === 0.02
            ? [-55, 4, 55]
            : progress === 1
              ? [-100, 90, 110]
              : [-70, 22, 70],
        fov: progress === 0.02 ? 25 : progress === 1 ? 40 : 32,
        poppygl: {
          lookAt:
            progress === 0.02
              ? [0, -10, 0]
              : progress === 1
                ? [0, 8, 0]
                : [0, 0, 0],
        },
        gltf: {
          explosion: {
            throughStageRef:
              progress === 0.02
                ? "RP2040_NEMA17.separate-motor"
                : "RP2040_NEMA17.lift-cover",
            stageProgress: progress,
          },
        },
      },
    })),
  })
}, 60000)
