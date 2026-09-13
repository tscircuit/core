import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PCB soldermask shows board tenting defaults and explicit via overrides", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={66} height={16} defaultViaTenting="top_tented">
      <pcbnotetext
        text="Board defaultViaTenting = top_tented"
        pcbY={5.5}
        fontSize={0.9}
      />
      <subcircuit name="Nested">
        <group>
          <pcbnotetext text="Inherited" pcbX={-25} pcbY={2.7} fontSize={0.65} />
          <via
            name="Inherited"
            pcbX={-25}
            holeDiameter={0.6}
            outerDiameter={1.2}
          />
        </group>
      </subcircuit>
      <pcbnotetext text="tented=true" pcbX={-15} pcbY={2.7} fontSize={0.65} />
      <via
        name="Both"
        pcbX={-15}
        tented
        holeDiameter={0.6}
        outerDiameter={1.2}
      />
      <pcbnotetext text="tented=false" pcbX={-5} pcbY={2.7} fontSize={0.65} />
      <via
        name="Exposed"
        pcbX={-5}
        tented={false}
        holeDiameter={0.6}
        outerDiameter={1.2}
      />
      <pcbnotetext text="top_tented" pcbX={5} pcbY={2.7} fontSize={0.65} />
      <via
        name="Top"
        pcbX={5}
        tented="top_tented"
        holeDiameter={0.6}
        outerDiameter={1.2}
      />
      <pcbnotetext text="bottom_tented" pcbX={15} pcbY={2.7} fontSize={0.65} />
      <via
        name="Bottom"
        pcbX={15}
        tented="bottom_tented"
        holeDiameter={0.6}
        outerDiameter={1.2}
      />
      <pcbnotetext text="Connector hole" pcbX={25} pcbY={2.7} fontSize={0.65} />
      <platedhole
        shape="circle"
        pcbX={25}
        holeDiameter={1.2}
        outerDiameter={2.4}
      />
      <pcbnotetext text="Unaffected" pcbX={25} pcbY={-2} fontSize={0.65} />
    </board>,
  )
  await circuit.renderUntilSettled()

  const viewLabel = circuit.db.pcb_note_text.insert({
    text: "TOP soldermask",
    anchor_position: { x: 0, y: -5.5 },
    anchor_alignment: "center",
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.65,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1400,
    height: 400,
    showSolderMask: true,
    layer: "top",
  })

  circuit.db.pcb_note_text.update(viewLabel.pcb_note_text_id, {
    text: "BOTTOM soldermask",
    layer: "bottom",
  })
  await expect(circuit).toMatchPcbSnapshot(
    import.meta.path.replace(".test.tsx", "-bottom.test.tsx"),
    { width: 1400, height: 400, showSolderMask: true, layer: "bottom" },
  )
})
