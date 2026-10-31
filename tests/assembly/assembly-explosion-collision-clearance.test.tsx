import { expect, test } from "bun:test"
import { Circuit, assembly } from "lib"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

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
  await expectAssemblySnapshot(import.meta.path, {
    title: "Clearance: pass through a bore and slide along a touching face",
    panels: [
      {
        title: "1. Peg moves through the stationary ring",
        circuit: circuit.getCircuitJson(),
        code: 'RING = subtract(cuboid([12,12,2]),\n  cylinder({ radius: 2, height: 4 }))\n\n<assembly.explosion.move\n  targetRefs={["PEG", "TOUCHING"]}\n  offZ={10} />',
        annotation:
          "The peg fits inside the hole; the outer block only touches the ring's side face.",
        renderOptions: {
          camPos: [-25, 24, 30],
          poppygl: { lookAt: [-1, 0, 0] },
          gltf: {
            explosion: {
              throughStageRef: "CLEARANCE.lift",
              stageProgress: 0.5,
            },
          },
        },
      },
      {
        title: "2. Ring moves around the stationary peg",
        circuit: circuit.getCircuitJson(),
        code: '<assembly.explosion.stage name="lift-ring"\n  prevStageRef="lift">\n  <assembly.explosion.move\n    targetRef="RING" offZ={10} />\n</assembly.explosion.stage>',
        annotation:
          "The swept ring retains its bore. Taking a hull of the whole part would falsely block the peg.",
        renderOptions: {
          camPos: [-25, 27, 30],
          poppygl: { lookAt: [-1, 5, 0] },
          gltf: {
            explosion: {
              throughStageRef: "CLEARANCE.lift-ring",
              stageProgress: 0.5,
            },
          },
        },
      },
    ],
  })
})
