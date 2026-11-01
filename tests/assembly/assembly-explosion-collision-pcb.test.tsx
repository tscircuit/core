import { expect, test } from "bun:test"
import { Circuit, assembly } from "lib"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("PCB substrate blocks an explosion while a drilled hole leaves clearance", async () => {
  const panels: Parameters<typeof expectAssemblySnapshot>[1]["panels"] = []
  for (const x of [0, 4]) {
    const circuit = new Circuit()
    circuit.add(
      <assembly.device name="PCB_TEST">
        <board width={14} height={12}>
          <hole name="MOUNT" diameter={3} />
        </board>
        <assembly.printedpart
          name="PIN"
          color="#3283b5"
          cadModel={{
            jscad: { type: "cylinder", radius: 0.5, height: 2 },
            positionOffset: { x, y: 0, z: -5 },
          }}
        />
        <assembly.explosion.stage name="lift">
          <assembly.explosion.move targetRef="PIN" offZ={10} />
        </assembly.explosion.stage>
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    expect(
      circuit.db.cad_explosion_collision_check_warning.list(),
    ).toHaveLength(0)
    const errors = circuit.db.cad_explosion_collision_error.list()
    expect(errors).toHaveLength(x === 0 ? 0 : 1)
    if (x !== 0)
      expect(errors[0].obstacle).toEqual({
        type: "pcb_board",
        pcb_board_id: circuit.db.pcb_board.list()[0].pcb_board_id,
      })
    panels.push({
      title:
        x === 0
          ? "1. Through the mounting hole: clear"
          : "2. Through solid PCB: collision",
      circuit: circuit.getCircuitJson(),
      code: '<board width={14} height={12}>\n  <hole name="MOUNT" diameter={3} />\n</board>\n\n<assembly.explosion.move\n  targetRef="PIN" offZ={10} />',
      annotation:
        x === 0
          ? "The pin rises through the actual drill; board bounds alone would give a false collision."
          : "The pin starts below the PCB and passes through its substrate at X=4 mm.",
      renderOptions: {
        camPos: [-22, 20, 26],
        poppygl: { lookAt: [0, 0, 0] },
        gltf: { explosion: { stageProgress: 0.5 } },
      },
    })
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "Explosion checks include the drilled PCB substrate",
    panels,
  })
})
