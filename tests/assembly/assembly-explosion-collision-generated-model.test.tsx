import { expect, test } from "bun:test"
import { Circuit, assembly, getAssemblyExplosion } from "lib"

test("the render phase checks generated capacitor geometry without a model_jscad record", async () => {
  const circuit = new Circuit()
  circuit.add(
    <assembly.device name="GENERATED">
      <assembly.part name="C1" cadModel="cap0402" />
      <assembly.part name="C2" cadModel="cap0402" />
      <assembly.explosion.stage name="separate">
        <assembly.explosion.move targetRef="C2" offX={3} />
      </assembly.explosion.stage>
      <assembly.explosion.stage name="slide" prevStageRef="separate">
        <assembly.explosion.move targetRef="C1" offX={6} />
      </assembly.explosion.stage>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.cad_component
      .list()
      .every((c) => Boolean(c.footprinter_string) && !c.model_jscad),
  ).toBe(true)
  expect(getAssemblyExplosion(circuit).collisionCheckStatus).toBe("checked")
  expect(circuit.db.cad_explosion_collision_check_warning.list()).toEqual([])
  const errors = circuit.db.cad_explosion_collision_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain('moves "C1" through "C2"')
  expect(errors[0].swept_intersection_volume_mm3).toBeCloseTo(0.25, 5)
})
