import { expect, test } from "bun:test"
import { Circuit, assembly } from "lib"
import type { AssemblyExplosionMove } from "lib/components/primitive-components/AssemblyExplosionMove"
import type { AssemblyExplosionStage } from "lib/components/primitive-components/AssemblyExplosionStage"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("initial overlap can separate, deeper penetration errors update and disappear on removal", async () => {
  const circuit = new Circuit()
  circuit.add(
    <assembly.device name="OVERLAP">
      <assembly.printedpart
        name="MOVING"
        color="#3283b5"
        cadModel={{ jscad: { type: "cube", size: 4 } }}
      />
      <assembly.printedpart
        name="FIXED"
        color="#d49438"
        cadModel={{
          jscad: { type: "cube", size: 4 },
          positionOffset: { x: 3, y: 0, z: 0 },
        }}
      />
      <assembly.explosion.stage name="separate">
        <assembly.explosion.move targetRef="MOVING" offX={-8} />
      </assembly.explosion.stage>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_explosion_collision_error.list()).toHaveLength(0)
  const panels = [
    {
      title: "1. Separating an existing overlap is allowed",
      code: '<assembly.explosion.move\n  targetRef="MOVING" offX={-8} />',
      annotation:
        "The initial overlap is excluded; moving along -X enters no new obstruction.",
      circuit: structuredClone(circuit.getCircuitJson()),
    },
  ]
  const stage = circuit.selectOne(".separate") as AssemblyExplosionStage
  const move = stage.children[0] as AssemblyExplosionMove
  const moveId = move.cad_explosion_move_id
  move.setProps({ ...move.props, offX: 8 })
  await circuit.renderUntilSettled()
  expect(move.cad_explosion_move_id).toBe(moveId)
  expect(circuit.db.cad_explosion_collision_error.list()).toHaveLength(1)
  expect(
    circuit.db.cad_explosion_collision_error.list()[0]
      .swept_intersection_volume_mm3,
  ).toBeCloseTo(48)
  panels.push({
    title: "2. Moving farther into the obstacle is an error",
    code: '<assembly.explosion.move\n  targetRef="MOVING" offX={8} />',
    annotation:
      "Only newly entered volume is reported; the initial overlap cannot hide a deeper collision.",
    circuit: structuredClone(circuit.getCircuitJson()),
  })
  move.setProps({ ...move.props, offX: -8 })
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_explosion_collision_error.list()).toHaveLength(0)
  move.setProps({ ...move.props, offX: 8 })
  circuit.render()
  stage.shouldBeRemoved = true
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_explosion_move.list()).toHaveLength(0)
  expect(circuit.db.cad_explosion_collision_error.list()).toHaveLength(0)
  expect(circuit.db.cad_explosion_collision_check_warning.list()).toHaveLength(
    0,
  )
  await expectAssemblySnapshot(import.meta.path, {
    title: "Existing overlap: separate freely, detect deeper collisions",
    panels: panels.map((panel) => ({
      ...panel,
      renderOptions: {
        camPos: [-18, 14, 20],
        poppygl: { lookAt: [0, 0, 0] },
        gltf: { explosion: {} },
      },
    })),
  })
})
