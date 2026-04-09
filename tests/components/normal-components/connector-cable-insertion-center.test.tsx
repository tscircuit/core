import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("connector populates pcb_component.cable_insertion_center", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="40mm">
      <connector
        name="J1"
        manufacturerPartNumber="AF_QTZB1_0"
        pinLabels={{
          pin1: ["VCC"],
          pin2: ["D_NEG"],
          pin3: ["D_POS"],
          pin4: ["GND"],
          pin5: ["EH1"],
          pin6: ["EH2"],
        }}
        footprint={
          <footprint>
            <hole
              pcbX="-2.499867999999992mm"
              pcbY="-2.1250021000000743mm"
              diameter="1.3000228mm"
            />
            <hole
              pcbX="2.500122000000033mm"
              pcbY="-2.1250021000000743mm"
              diameter="1.3000228mm"
            />
            <smtpad
              portHints={["pin1"]}
              pcbX="-3.4998659999999973mm"
              pcbY="1.5750158999999258mm"
              width="1.0999978mm"
              height="3.7999924mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX="-0.9999979999997777mm"
              pcbY="1.5750158999999258mm"
              width="1.0999978mm"
              height="3.7999924mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin3"]}
              pcbX="0.999998000000005mm"
              pcbY="1.5750158999999258mm"
              width="1.0999978mm"
              height="3.7999924mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin4"]}
              pcbX="3.499866000000111mm"
              pcbY="1.5750158999999258mm"
              width="1.0999978mm"
              height="3.7999924mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin5"]}
              pcbX="7.150100000000066mm"
              pcbY="-1.475016099999948mm"
              width="1.7999964mm"
              height="3.9999919999999998mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin6"]}
              pcbX="-7.150099999999952mm"
              pcbY="-1.475016099999948mm"
              width="1.7999964mm"
              height="3.9999919999999998mm"
              shape="rect"
            />
          </footprint>
        }
      />
    </board>,
  )
  circuit.render()

  const sourceConnector = circuit.db.source_component
    .list()
    .find((c) => c.ftype === "simple_connector")

  expect(sourceConnector).toBeDefined()

  const pcbConnector = circuit.db.pcb_component
    .list()
    .find(
      (pc) => pc.source_component_id === sourceConnector?.source_component_id,
    )

  expect(pcbConnector).toBeDefined()
  expect(pcbConnector?.cable_insertion_center).toBeDefined()
  expect(typeof pcbConnector?.cable_insertion_center?.x).toBe("number")
  expect(typeof pcbConnector?.cable_insertion_center?.y).toBe("number")

  const circuitJson = await circuit.getCircuitJson()
  const cableCenter = pcbConnector?.cable_insertion_center

  if (cableCenter) {
    circuitJson.push({
      type: "pcb_note_rect",
      pcb_note_rect_id: "pcb_note_rect_cable_center_J1",
      center: {
        x: cableCenter.x,
        y: cableCenter.y,
      },
      width: 1,
      height: 1,
      layer: "top",
      stroke_width: 0.1,
      is_filled: false,
      has_stroke: true,
      is_stroke_dashed: true,
      color: "#00ffff",
      text: "cable center",
      pcb_component_id: pcbConnector?.pcb_component_id,
    })
  }

  await expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
