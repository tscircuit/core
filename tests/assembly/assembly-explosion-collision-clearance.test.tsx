import { expect, test } from "bun:test"
import { Circuit, assembly } from "lib"

test("concave solids preserve holes and face contact is not a collision", async () => {
  const circuit = new Circuit()
  circuit.add(
    <assembly.device name="CLEARANCE">
      <assembly.printedpart
        name="RING"
        color="#d49438"
        cadModel={{
          jscad: {
            type: "subtract",
            shapes: [
              { type: "cuboid", size: [12, 12, 2] },
              { type: "cylinder", radius: 2, height: 4 },
            ],
          },
        }}
      />
      <assembly.printedpart
        name="PEG"
        color="#3283b5"
        cadModel={{
          jscad: { type: "cylinder", radius: 1, height: 2 },
          positionOffset: { x: 0, y: 0, z: -5 },
        }}
      />
      <assembly.printedpart
        name="TOUCHING"
        color="#3283b5"
        cadModel={{
          jscad: { type: "cuboid", size: [2, 2, 2] },
          positionOffset: { x: 7, y: 0, z: -5 },
        }}
      />
      <assembly.explosion.stage name="lift">
        <assembly.explosion.move targetRefs={["PEG", "TOUCHING"]} offZ={10} />
      </assembly.explosion.stage>
      <assembly.explosion.stage name="lift-ring" prevStageRef="lift">
        <assembly.explosion.move targetRef="RING" offZ={10} />
      </assembly.explosion.stage>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_explosion_collision_error.list()).toHaveLength(0)
  expect(circuit.db.cad_explosion_collision_check_warning.list()).toHaveLength(
    0,
  )
})
