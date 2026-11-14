import { expect, test } from "bun:test"
import { assembly } from "lib"
import { any_circuit_element } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("drawing stages compose populated boards and parts with forward references and shared membership", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="DEVICE">
      <board name="pcb" width={24} height={16} routingDisabled>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={5}
          cadModel={{ jscad: { type: "cuboid", size: [1, 0.5, 0.4] } }}
        />
      </board>
      <assembly.part
        name="CAP"
        cadModel={{
          jscad: { type: "cuboid", size: [10, 8, 4], center: [0, 0, 8] },
        }}
      />
      <assembly.drawing.page
        name="sub-stages"
        width={260}
        height={180}
        anchorAlignment="bottom_left"
      >
        <assembly.drawing.titleblock title="ASSEMBLY MEMBERSHIP - PCB + CAP" />
        <assembly.drawing.partview
          name="pcba"
          displayName="POPULATED PCB"
          stageRef=".pcba"
          direction="isometric"
          width={90}
          height={75}
          centerX={65}
          centerY={110}
        >
          <assembly.drawing.partlabel
            partRefs={[".R1"]}
            text="R1"
            anchor={{ x: 5, y: 0, z: 2 }}
            xOffsetFromViewCenter={30}
            yOffsetFromViewCenter={30}
          />
          <assembly.drawing.note
            text="Board and fitted resistor"
            xOffsetFromViewCenter={-35}
            yOffsetFromViewCenter={-45}
          />
        </assembly.drawing.partview>
        <assembly.drawing.partview
          name="complete-view"
          displayName="PCB + CAP"
          stageRef=".complete"
          direction="isometric"
          width={90}
          height={75}
          rightOfRef=".pcba"
          centerY={110}
        >
          <assembly.drawing.dimension widthOfView />
        </assembly.drawing.partview>
      </assembly.drawing.page>
      <assembly.drawing.page name="second" width={100} height={100}>
        <assembly.drawing.partview
          name="pcba-repeat"
          stageRef=".pcba"
          direction="z+"
          width={50}
          height={50}
        />
      </assembly.drawing.page>
      <assembly.drawing.stage
        name="complete"
        partRefs={[".CAP"]}
        includeStageRefs={[".pcba"]}
      />
      <assembly.drawing.stage
        name="pcba"
        boardRefs={[".pcb"]}
        partRefs={[".R1"]}
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const stages = circuit.db.drawing_assembly_stage.list()
  expect(stages).toHaveLength(2)
  const [pcba, complete] = stages
  expect(pcba.pcb_board_ids).toEqual([
    circuit.db.pcb_board.list()[0].pcb_board_id,
  ])
  expect(complete.source_component_ids).toHaveLength(2)
  expect(complete.pcb_board_ids).toEqual(pcba.pcb_board_ids)
  const views = circuit.db.drawing_part_view.list()
  expect(
    views.find((view) => view.name === "pcba")!.drawing_assembly_stage_id,
  ).toBe(
    views.find((view) => view.name === "pcba-repeat")!
      .drawing_assembly_stage_id,
  )
  for (const record of circuit
    .getCircuitJson()
    .filter((record) => record.type.startsWith("drawing_")))
    any_circuit_element.parse(record)
  const before = structuredClone(circuit.getCircuitJson())
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path, {
    drawingPageId: circuit.db.drawing_page
      .list()
      .find((page) => page.name === "sub-stages")!.drawing_page_id,
  })
  expect(circuit.getCircuitJson()).toEqual(before)
})
