import { expect, test } from "bun:test"
import { Circuit, assembly, getAssemblyExplosion } from "lib"
import { any_circuit_element } from "circuit-json"

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
})
