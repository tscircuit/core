import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { expect, test } from "bun:test"
import { Circuit, assembly, getCircuitJsonAssemblyExplosion } from "lib"
import { AssemblyExplosionMove } from "lib/components/primitive-components/AssemblyExplosionMove"
import type { AssemblyExplosionStage } from "lib/components/primitive-components/AssemblyExplosionStage"

test("render phases own stable explosion IDs and update dependent membership, order and removal", async () => {
  const circuit = new Circuit()
  circuit.add(
    <assembly.device name="D">
      <assembly.explosion.stage name="park" prevStageRef="lift">
        <assembly.explosion.move targetRef="lift" offX={20} />
      </assembly.explosion.stage>
      <assembly.explosion.stage name="lift">
        <assembly.explosion.move targetRef="A" offZ={10} />
      </assembly.explosion.stage>
      <assembly.part name="A" cadModel={{ jscad: { type: "cube", size: 2 } }} />
      <assembly.part name="B" cadModel={{ jscad: { type: "cube", size: 4 } }} />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const park = circuit.selectOne(".park") as AssemblyExplosionStage
  const lift = circuit.selectOne(".lift") as AssemblyExplosionStage
  const liftMove = lift.children[0] as AssemblyExplosionMove
  const db = circuit.db
  const parkId = park.cad_explosion_stage_id!
  const liftId = lift.cad_explosion_stage_id!
  const moveId = liftMove.cad_explosion_move_id!
  const aId = circuit.selectOne(".A")!.cad_component_id!
  const bId = circuit.selectOne(".B")!.cad_component_id!

  // Observe the database before ever calling the JSON getter. Forward stage
  // references must resolve even though both stages precede their CAD targets.
  expect(db.cad_explosion_stage.get(liftId)).toMatchObject({
    order: 0,
    cad_component_ids: [aId],
  })
  expect(db.cad_explosion_stage.get(parkId)).toMatchObject({
    order: 1,
    cad_component_ids: [aId],
  })
  expect(
    db.cad_explosion_move
      .list()
      .find((move) => move.cad_explosion_stage_id === parkId)?.targets,
  ).toEqual([{ type: "cad_explosion_stage", cad_explosion_stage_id: liftId }])
  const initial = structuredClone(db.toArray())
  const panels: Parameters<typeof expectAssemblySnapshot>[1]["panels"] = [
    {
      title: "1. Initial move targets A",
      code: 'targetRef="A" offZ={10}\npark: targetRef="lift" offX={20}',
      annotation:
        "Small A is lifted and parked; large B remains at the origin.",
      circuit: initial,
    },
  ]
  await circuit.renderUntilSettled()
  expect(db.toArray()).toEqual(initial)

  liftMove.setProps({ ...liftMove.props, targetRef: "B", offZ: 15 })
  await circuit.renderUntilSettled()
  expect(liftMove.cad_explosion_move_id).toBe(moveId)
  expect(db.cad_explosion_move.get(moveId)).toMatchObject({
    translation: { x: 0, y: 0, z: 15 },
  })
  expect(db.cad_explosion_stage.get(liftId)?.cad_component_ids).toEqual([bId])
  expect(db.cad_explosion_stage.get(parkId)?.cad_component_ids).toEqual([bId])
  const moved = getCircuitJsonAssemblyExplosion(db.toArray()).circuitJson.find(
    (record) =>
      record.type === "cad_component" && record.cad_component_id === bId,
  )
  expect(moved).toMatchObject({ position: { x: 20, y: 0, z: 15 } })

  panels.push({
    title: "2. Change the move target to B",
    code: 'liftMove.setProps({\n  targetRef: "B", offZ: 15\n})\nawait circuit.renderUntilSettled()',
    annotation:
      "Membership updates transitively: large B moves; A returns to the origin.",
    circuit: structuredClone(db.toArray()),
  })

  const addedMove = new AssemblyExplosionMove({ targetRef: "A", offY: 3 })
  lift.add(addedMove)
  await circuit.renderUntilSettled()
  expect(
    db.cad_explosion_move.get(addedMove.cad_explosion_move_id!)?.order,
  ).toBe(1)
  expect(db.cad_explosion_stage.get(parkId)?.cad_component_ids).toEqual([
    bId,
    aId,
  ])
  addedMove.shouldBeRemoved = true
  await circuit.renderUntilSettled()
  expect(db.cad_explosion_move.list()).toHaveLength(2)
  expect(db.cad_explosion_stage.get(parkId)?.cad_component_ids).toEqual([bId])

  // Changing playback order must not change identities or stage references.
  park.setProps({ ...park.props, prevStageRef: undefined })
  lift.setProps({ ...lift.props, prevStageRef: "park" })
  await circuit.renderUntilSettled()
  expect(db.cad_explosion_stage.get(parkId)?.order).toBe(0)
  expect(db.cad_explosion_stage.get(liftId)?.order).toBe(1)
  expect(lift.cad_explosion_stage_id).toBe(liftId)
  expect(liftMove.cad_explosion_move_id).toBe(moveId)

  lift.setProps({ ...lift.props, prevStageRef: undefined })
  park.shouldBeRemoved = true
  await circuit.renderUntilSettled()
  expect(db.cad_explosion_stage.list()).toHaveLength(1)
  expect(db.cad_explosion_stage.get(liftId)?.order).toBe(0)
  expect(db.cad_explosion_move.list()).toHaveLength(1)
  expect(db.cad_explosion_move.get(moveId)?.cad_explosion_stage_id).toBe(liftId)
  expect(circuit.getCircuitJson()).toEqual(db.toArray())

  panels.push({
    title: "3. Remove the park stage",
    code: "park.shouldBeRemoved = true\nawait circuit.renderUntilSettled()",
    annotation:
      "B still lifts, but the removed stage no longer translates it sideways.",
    circuit: structuredClone(db.toArray()),
  })

  park.shouldBeRemoved = false
  await circuit.renderUntilSettled()
  expect(db.cad_explosion_stage.list()).toHaveLength(2)
  expect(db.cad_explosion_move.list()).toHaveLength(2)
  expect(() => getCircuitJsonAssemblyExplosion(db.toArray())).not.toThrow()
  panels.push({
    title: "4. Restore the park stage",
    code: "park.shouldBeRemoved = false\nawait circuit.renderUntilSettled()",
    annotation:
      "Stage and owned move records are recreated; whole-stage playback is restored.",
    circuit: structuredClone(db.toArray()),
  })
  await expectAssemblySnapshot(import.meta.path, {
    title:
      "Render lifecycle: visual consequences of retargeting and stage removal",
    columns: 2,
    font: "alphabet",
    panels: panels.map((panel) => ({
      ...panel,
      renderOptions: {
        camPos: [-35, 26, 30],
        poppygl: {
          lookAt: [-10, 7, 0],
        },
        gltf: { explosion: {} },
      },
    })),
  })
})
