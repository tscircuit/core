import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { any_circuit_element } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explosion drawings inherit cumulative stage moves with independent factors and annotations", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="COUNTER">
      <assembly.part
        name="BASE"
        cadModel={{ jscad: { type: "cuboid", size: [32, 22, 4] } }}
      >
        <assembly.referencesurface name="top" centerZOffset="2mm" />
      </assembly.part>
      <assembly.subassembly name="ROTOR">
        <assembly.printedpart
          name="CAP"
          mountedTo="BASE.top"
          mountFace="bottom"
          jscad={<jscad.cylinder radius={9} height={5} center={[0, 0, 2.5]} />}
        >
          <assembly.referencesurface name="bottom" normalDirection="z-" />
        </assembly.printedpart>
        <assembly.part
          name="MAGNET"
          cadModel={{
            jscad: { type: "cuboid", size: [4, 4, 2], center: [0, 0, 8] },
          }}
        />
      </assembly.subassembly>
      <assembly.explosion.stage name="lift" nextStageRef="slide">
        <assembly.explosion.move targetRefs="ROTOR" offZ="12mm" />
      </assembly.explosion.stage>
      <assembly.explosion.stage name="slide">
        <assembly.explosion.move targetRefs="ROTOR, ROTOR.CAP" offX="18mm" />
        <assembly.explosion.move targetRefs="ROTOR.MAGNET" offY="4mm" />
      </assembly.explosion.stage>
      <assembly.drawing.page
        name="assembly-instructions"
        width="300mm"
        height="180mm"
        anchorAlignment="bottom_left"
      >
        <assembly.drawing.titleblock title="COUNTER - INHERITED ASSEMBLY MOVES" />
        <assembly.drawing.explosionview
          name="full"
          displayName="STAGE: SLIDE"
          stageRef="slide"
          direction="isometric"
          width={85}
          height={90}
          centerX={150}
          centerY={100}
          showTrails
        >
          <assembly.drawing.partlabel
            text="Cap"
            partRefs={[".CAP"]}
            anchor={{ x: 0, y: 0, z: 5 }}
            xOffsetFromViewCenter={35}
            yOffsetFromViewCenter={35}
          />
          <assembly.drawing.note
            text="Lift 12, then slide 18"
            paperX={112}
            yOffsetFromViewCenter={-36}
          />
          <assembly.drawing.dimension heightOfView />
        </assembly.drawing.explosionview>
        <assembly.drawing.explosionview
          name="assembled"
          displayName="FACTOR 0: ASSEMBLED"
          stageRef="slide"
          factor={0}
          direction="isometric"
          width={85}
          height={90}
          leftOfRef=".full"
          centerY={100}
        />
        <assembly.drawing.explosionview
          name="half"
          displayName="FACTOR 0.5"
          stageRef="slide"
          factor={0.5}
          direction="isometric"
          width={85}
          height={90}
          rightOfRef=".full"
          centerY={100}
        />
        <assembly.drawing.note
          text="Same stage, three views"
          viewRef=".full"
          xOffsetFromViewCenter={-40}
          paperY={163}
        />
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const records = circuit.getCircuitJson()
  for (const record of records.filter((record) =>
    record.type.startsWith("drawing_"),
  ))
    any_circuit_element.parse(record)
  const views = circuit.db.drawing_explosion_view.list()
  expect(views.map((view) => view.factor)).toEqual([1, 0, 0.5])
  expect(views.map((view) => view.center.x)).toEqual([150, 65, 235])
  expect(views[1].moves).toEqual(views[0].moves)
  expect(views[2].moves).toEqual(views[0].moves)
  for (const [name, translation] of [
    ["BASE", { x: 0, y: 0, z: 0 }],
    ["CAP", { x: 18, y: 0, z: 12 }],
    ["MAGNET", { x: 18, y: 4, z: 12 }],
  ] as const) {
    const source = circuit.db.source_component
      .list()
      .find((part) => part.name === name)!
    expect(
      views[0].moves.find((move) =>
        move.source_component_ids?.includes(source.source_component_id),
      )?.translation,
    ).toEqual(translation)
  }
  expect(
    circuit.db.drawing_dimension_line.list()[0].drawing_explosion_view_id,
  ).toBe(views[0].drawing_explosion_view_id)
  expect(circuit.db.drawing_page.list()[0].anchor_alignment).toBe("bottom_left")
  expect(
    circuit.db.drawing_page_note
      .list()
      .every(
        (note) =>
          note.drawing_explosion_view_id === views[0].drawing_explosion_view_id,
      ),
  ).toBe(true)
  const before = structuredClone(records)
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
  circuit.render()
  expect(circuit.getCircuitJson()).toEqual(before)
})
