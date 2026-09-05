import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("internally connected pads receive fabrication notes when the footprint has none", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="18mm" height="10mm">
      <pcbnotetext
        text="U1: AUTO MARKED / U2: EXISTING FAB NOTE"
        pcbY={4}
        fontSize={0.25}
      />
      <chip
        name="U1"
        pcbX={-4}
        pinLabels={{ pin1: "A", pin2: "B" }}
        internallyConnectedPins={[["pin1", "pin2"]]}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width={1}
              height={1}
              pcbX={-2}
              portHints={["pin1"]}
            />
            <smtpad
              shape="rect"
              width={1}
              height={1}
              pcbX={2}
              portHints={["pin2"]}
            />
          </footprint>
        }
      />
      <chip
        name="U2"
        pcbX={4}
        pinLabels={{ pin1: "A", pin2: "B" }}
        internallyConnectedPins={[["pin1", "pin2"]]}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width={1}
              height={1}
              pcbX={-2}
              portHints={["pin1"]}
            />
            <smtpad
              shape="rect"
              width={1}
              height={1}
              pcbX={2}
              portHints={["pin2"]}
            />
            <fabricationnotetext
              text="EXISTING FAB NOTE"
              pcbY={1}
              fontSize={0.2}
            />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponents = circuit.db.source_component.list()
  const pcbComponents = circuit.db.pcb_component.list()
  const getPcbComponentId = (name: string) => {
    const sourceComponent = sourceComponents.find(
      (sourceComponent) => sourceComponent.name === name,
    )!
    return pcbComponents.find(
      (pcbComponent) =>
        pcbComponent.source_component_id ===
        sourceComponent.source_component_id,
    )!.pcb_component_id
  }

  const u1PcbComponentId = getPcbComponentId("U1")
  const u2PcbComponentId = getPcbComponentId("U2")
  const autoNoteTexts = circuit.db.pcb_fabrication_note_text.list({
    text: "MARKED INTERNALLY CONNECTED",
  })

  expect(autoNoteTexts).toHaveLength(1)
  expect(autoNoteTexts[0]).toMatchObject({
    pcb_component_id: u1PcbComponentId,
    font_size: 0.12,
  })
  expect(
    circuit.db.pcb_fabrication_note_path.list({
      pcb_component_id: u1PcbComponentId,
    }),
  ).toHaveLength(1)
  expect(
    circuit.db.pcb_fabrication_note_path.list({
      pcb_component_id: u2PcbComponentId,
    }),
  ).toHaveLength(0)
  expect(
    circuit.db.pcb_fabrication_note_text.list({
      pcb_component_id: u2PcbComponentId,
    }),
  ).toHaveLength(1)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
