import { expect, test } from "bun:test"
import { Circuit, assembly } from "lib"
import type { AssemblyExplosionMove } from "lib/components/primitive-components/AssemblyExplosionMove"
import type { AssemblyExplosionStage } from "lib/components/primitive-components/AssemblyExplosionStage"

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
})
