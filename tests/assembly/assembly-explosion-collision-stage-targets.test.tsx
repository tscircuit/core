import { expect, test } from "bun:test"
import { Circuit, assembly } from "lib"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

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
  await expectAssemblySnapshot(import.meta.path, {
    title: "Whole-stage movement: carry together, then check removal",
    panels: [
      {
        title: "1. Cover and bolt move together",
        code: 'targetRefs={["COVER", "remove-bolt", "BOLT"]}\noffZ={10}',
        annotation:
          "The repeated bolt selection moves once. No relative motion occurs within the group.",
        stage: "STAGES.lift-cover",
        progress: 1,
      },
      {
        title: "2. Bolt encounters the bracket after the lift",
        code: '<assembly.explosion.stage name="remove-bolt"\n  prevStageRef="lift-cover">\n  <assembly.explosion.move\n    targetRef="BOLT" offX={12} />\n</assembly.explosion.stage>',
        annotation:
          "The collision is checked at the displaced Z=13 mm position, not the original pose.",
        stage: "STAGES.remove-bolt",
        progress: 0.5,
      },
    ].map(({ stage, progress, ...panel }) => ({
      ...panel,
      circuit: circuit.getCircuitJson(),
      renderOptions: {
        camPos: [-25, 25, 32],
        poppygl: { lookAt: [-3, 8, 0] },
        gltf: {
          explosion: { throughStageRef: stage, stageProgress: progress },
        },
      },
    })),
  })
})
