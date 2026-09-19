import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PCB soldermask shows board tenting defaults and explicit via overrides", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel width={60} height={38}>
      <board
        name="A"
        width={56}
        height={16}
        pcbY={9}
        defaultViaTenting="top_tented"
      >
        <pcbnotetext
          text="Board A defaults: top: true, bottom: false"
          pcbY={5.5}
          fontSize={0.9}
        />
        <subcircuit name="Nested">
          <group>
            <pcbnotetext
              text="top: unset"
              pcbX={-20}
              pcbY={3.3}
              fontSize={0.65}
            />
            <pcbnotetext
              text="bottom: unset"
              pcbX={-20}
              pcbY={2}
              fontSize={0.65}
            />
            <via
              name="Inherited"
              pcbX={-20}
              holeDiameter={0.6}
              outerDiameter={1.2}
            />
          </group>
        </subcircuit>
        <pcbnotetext text="tented=true" pcbX={-10} pcbY={2.7} fontSize={0.65} />
        <via
          name="Both"
          pcbX={-10}
          tented
          holeDiameter={0.6}
          outerDiameter={1.2}
        />
        <pcbnotetext text="tented=false" pcbX={0} pcbY={2.7} fontSize={0.65} />
        <via
          name="Exposed"
          pcbX={0}
          tented={false}
          holeDiameter={0.6}
          outerDiameter={1.2}
        />
        <pcbnotetext text="top_tented" pcbX={10} pcbY={2.7} fontSize={0.65} />
        <via
          name="Top"
          pcbX={10}
          tented="top_tented"
          holeDiameter={0.6}
          outerDiameter={1.2}
        />
        <pcbnotetext
          text="bottom_tented"
          pcbX={20}
          pcbY={2.7}
          fontSize={0.65}
        />
        <via
          name="Bottom"
          pcbX={20}
          tented="bottom_tented"
          holeDiameter={0.6}
          outerDiameter={1.2}
        />
      </board>
      <board
        name="B"
        width={56}
        height={16}
        pcbY={-9}
        defaultViaTenting="bottom_tented"
      >
        <pcbnotetext
          text="Board B defaults: top: false, bottom: true"
          pcbY={5.5}
          fontSize={0.9}
        />
        <subcircuit name="NestedB">
          <pcbnotetext
            text="top: unset, bottom: unset"
            pcbX={-15}
            pcbY={2.7}
            fontSize={0.65}
          />
          <via
            name="InheritedB"
            pcbX={-15}
            holeDiameter={0.6}
            outerDiameter={1.2}
          />
          <pcbnotetext
            text="Expect top exposed, bottom tented"
            pcbX={-15}
            pcbY={-2.7}
            fontSize={0.65}
          />
        </subcircuit>
        <pcbnotetext text="tented=false" pcbX={15} pcbY={2.7} fontSize={0.65} />
        <via
          name="ExposedB"
          pcbX={15}
          tented={false}
          holeDiameter={0.6}
          outerDiameter={1.2}
        />
        <pcbnotetext
          text="Expect both exposed"
          pcbX={15}
          pcbY={-2.7}
          fontSize={0.65}
        />
      </board>
    </panel>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_board.list()).toMatchObject([
    {
      default_via_tented_on_top: true,
      default_via_tented_on_bottom: false,
    },
    {
      default_via_tented_on_top: false,
      default_via_tented_on_bottom: true,
    },
  ])
  expect(circuit.db.pcb_via.list()).toMatchObject([
    { tented_on_top: undefined, tented_on_bottom: undefined },
    { tented_on_top: true, tented_on_bottom: true },
    { tented_on_top: false, tented_on_bottom: false },
    { tented_on_top: true, tented_on_bottom: false },
    { tented_on_top: false, tented_on_bottom: true },
    { tented_on_top: undefined, tented_on_bottom: undefined },
    { tented_on_top: false, tented_on_bottom: false },
  ])

  const viewLabel = circuit.db.pcb_note_text.insert({
    text: "TOP soldermask",
    anchor_position: { x: 0, y: 0 },
    anchor_alignment: "center",
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.65,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1400,
    height: 850,
    showSolderMask: true,
    layer: "top",
  })

  circuit.db.pcb_note_text.update(viewLabel.pcb_note_text_id, {
    text: "BOTTOM soldermask",
    layer: "bottom",
  })
  await expect(circuit).toMatchPcbSnapshot(
    import.meta.path.replace(".test.tsx", "-bottom.test.tsx"),
    { width: 1400, height: 850, showSolderMask: true, layer: "bottom" },
  )
})
