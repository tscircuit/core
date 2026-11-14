import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("invalid inherited explosion references and annotations leave no partial drawing records", async () => {
  const view = {
    stageRef: "lift",
    direction: "isometric" as const,
    width: 60,
    height: 50,
  }
  const cases = [
    {
      stageRef: "missing",
      error: "must reference exactly one assembly.explosion.stage",
    },
    {
      stageRef: "members",
      error: "must reference exactly one assembly.explosion.stage",
    },
    { stageRef: "empty", error: "has no moves to draw" },
    { note: true, error: "needs a viewRef" },
    { crossPage: true, error: "must select one view on its page" },
    { label: true, error: "outside its view" },
    { mixedLabel: true, error: "different displacements" },
    { cycle: true, error: "membership cycle" },
    { badBoard: true, error: "must select rendered boards" },
  ]
  for (const scenario of cases) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device name="DEVICE">
        <assembly.part
          name="BASE"
          cadModel={{ jscad: { type: "cuboid", size: [10, 10, 2] } }}
        />
        <assembly.subassembly name="MODULE">
          <assembly.part
            name="CAP"
            cadModel={{
              jscad: { type: "cuboid", size: [5, 5, 2], center: [0, 0, 4] },
            }}
          />
          <assembly.explosion.stage name="lift">
            <assembly.explosion.move targetRefs="CAP" offZ={8} />
          </assembly.explosion.stage>
        </assembly.subassembly>
        <assembly.explosion.stage name="lift">
          <assembly.explosion.move targetRefs="MODULE" offZ={8} />
        </assembly.explosion.stage>
        <assembly.explosion.stage name="empty" />
        <assembly.drawing.stage name="members" partRefs={[".CAP"]} />
        <assembly.drawing.stage name="cycle" includeStageRefs={[".cycle"]} />
        <assembly.drawing.stage name="bad-board" boardRefs={[".CAP"]} />
        <assembly.drawing.page width={200} height={150}>
          <assembly.drawing.explosionview
            {...view}
            stageRef={
              scenario.stageRef ?? (scenario.label ? "MODULE.lift" : "lift")
            }
          >
            {scenario.label && (
              <assembly.drawing.partlabel
                text="Hidden base"
                partRefs={[".BASE"]}
                anchor={{ x: 0, y: 0, z: 0 }}
                paperX={0}
                paperY={0}
              />
            )}
            {scenario.mixedLabel && (
              <assembly.drawing.partlabel
                text="Different poses"
                partRefs={[".CAP", ".BASE"]}
                anchor={{ x: 0, y: 0, z: 0 }}
                paperX={0}
                paperY={0}
              />
            )}
          </assembly.drawing.explosionview>
          {scenario.note && (
            <assembly.drawing.note
              text="No view"
              xOffsetFromViewCenter={0}
              paperY={0}
            />
          )}
          {scenario.crossPage && (
            <assembly.drawing.note
              text="Wrong page"
              viewRef=".other"
              xOffsetFromViewCenter={0}
              paperY={0}
            />
          )}
          {(scenario.cycle || scenario.badBoard) && (
            <assembly.drawing.partview
              stageRef={scenario.cycle ? ".cycle" : ".bad-board"}
              direction="z+"
              width={30}
              height={30}
            />
          )}
        </assembly.drawing.page>
        <assembly.drawing.page width={100} height={100}>
          <assembly.drawing.partview
            name="other"
            partRef=".BASE"
            direction="z+"
            width={30}
            height={30}
          />
        </assembly.drawing.page>
      </assembly.device>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(scenario.error)
    expect(circuit.db.drawing_page.list()).toHaveLength(0)
    expect(circuit.db.drawing_explosion_view.list()).toHaveLength(0)
    expect(circuit.db.drawing_assembly_stage.list()).toHaveLength(0)
  }
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="VALID">
      <assembly.part
        name="CAP"
        cadModel={{ jscad: { type: "cuboid", size: [10, 8, 2] } }}
      />
      <assembly.explosion.stage name="lift">
        <assembly.explosion.move targetRefs="CAP" offZ={8} />
      </assembly.explosion.stage>
      <assembly.drawing.page width={100} height={100}>
        <assembly.drawing.explosionview
          {...view}
          displayName="VALID INHERITED STAGE"
        />
        <assembly.drawing.note
          text="Invalid references fail before emission"
          paperX={-42}
          paperY={40}
        />
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
})
