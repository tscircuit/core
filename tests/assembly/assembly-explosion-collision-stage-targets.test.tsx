import { expect, test } from "bun:test"
import { Circuit, assembly } from "lib"

test("whole-stage targets move together once and later collisions use accumulated positions", async () => {
  const circuit = new Circuit()
  circuit.add(
    <assembly.device name="STAGES">
      <assembly.printedpart
        name="COVER"
        color="#3283b5"
        cadModel={{ jscad: { type: "cuboid", size: [8, 6, 1] } }}
      />
      <assembly.printedpart
        name="BOLT"
        color="#888888"
        cadModel={{
          jscad: { type: "cylinder", radius: 0.5, height: 2 },
          positionOffset: { x: 0, y: 0, z: 3 },
        }}
      />
      <assembly.printedpart
        name="BRACKET"
        color="#d49438"
        cadModel={{
          jscad: { type: "cuboid", size: [1, 3, 3] },
          positionOffset: { x: 6, y: 0, z: 13 },
        }}
      />
      <assembly.explosion.stage name="lift-cover">
        <assembly.explosion.move
          targetRefs={["COVER", "remove-bolt", "BOLT"]}
          offZ={10}
        />
      </assembly.explosion.stage>
      <assembly.explosion.stage name="remove-bolt" prevStageRef="lift-cover">
        <assembly.explosion.move targetRef="BOLT" offX={12} />
      </assembly.explosion.stage>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const errors = circuit.db.cad_explosion_collision_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]).toMatchObject({
    cad_explosion_stage_id: circuit.db.cad_explosion_stage
      .list()
      .find((stage) => stage.name === "STAGES.remove-bolt")!
      .cad_explosion_stage_id,
    moving_cad_component_id: circuit.selectOne(".BOLT")!.cad_component_id,
    obstacle: {
      type: "cad_component",
      cad_component_id: circuit.selectOne(".BRACKET")!.cad_component_id,
    },
  })
  // The checker must never bake exploded positions into assembled CAD.
  expect(
    circuit.db.cad_component.get(circuit.selectOne(".BOLT")!.cad_component_id!)!
      .position.z,
  ).toBe(3)
})
