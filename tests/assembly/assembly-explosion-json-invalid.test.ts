import { expect, test } from "bun:test"
import { getCircuitJsonAssemblyExplosion } from "lib"

test("JSON playback rejects invalid later-stage references, membership, ordering and geometry before partial playback", () => {
  const cad = {
    type: "cad_component",
    cad_component_id: "cad",
    source_component_id: "source",
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
  }
  const stage = {
    type: "cad_explosion_stage",
    cad_explosion_stage_id: "stage",
    name: "device.stage",
    order: 0,
    cad_component_ids: ["cad"],
  }
  const move = {
    type: "cad_explosion_move",
    cad_explosion_move_id: "move",
    cad_explosion_stage_id: "stage",
    order: 0,
    targets: [{ type: "cad_explosion_stage", cad_explosion_stage_id: "stage" }],
    translation: { x: 0, y: 0, z: 10 },
  }
  expect(
    getCircuitJsonAssemblyExplosion([cad, stage, move] as any).stages,
  ).toEqual([stage.name])
  for (const json of [
    [cad, stage, { ...move, order: 1 }],
    [cad, { ...stage, order: 1 }, move],
    [cad, stage, move, move],
    [cad, stage, { ...move, cad_explosion_stage_id: "missing" }],
    [
      cad,
      stage,
      {
        ...move,
        targets: [
          { type: "cad_explosion_stage", cad_explosion_stage_id: "missing" },
        ],
      },
    ],
    [cad, { ...stage, cad_component_ids: ["missing"] }, move],
    [cad, { ...stage, cad_component_ids: ["cad", "cad"] }, move],
    [
      cad,
      { ...stage, cad_component_ids: [] },
      {
        ...move,
        targets: [{ type: "cad_component", cad_component_id: "cad" }],
      },
    ],
    [{ ...cad, pcb_component_id: "pcb" }, stage, move],
    [cad, stage, { ...move, translation: { x: Infinity, y: 0, z: 0 } }],
    [
      cad,
      stage,
      move,
      {
        ...stage,
        cad_explosion_stage_id: "later",
        name: "later",
        order: 1,
        cad_component_ids: ["missing"],
      },
    ],
  ])
    expect(() =>
      getCircuitJsonAssemblyExplosion(json as any, {
        throughStageRef: stage.name,
        stageProgress: 0,
      }),
    ).toThrow()
})
