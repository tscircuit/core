import { expect, test } from "bun:test"
import { fp } from "@tscircuit/footprinter"
import { any_circuit_element, type AnyCircuitElement } from "circuit-json"
import { Board } from "lib/components/normal-components/Board/Board"
import { Led } from "lib/components/normal-components/Led"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("polarity intent survives Circuit JSON import and export without requiring sign labels", async () => {
  const { circuit } = getTestFixture()
  const board = new Board({ width: 46, height: 14, routingDisabled: true })
  board.add(
    <pcbnotetext
      text="Imported polarity paths or K text: one indication after JSON round trip"
      pcbY={5}
      fontSize={0.4}
    />,
  )

  for (const [col, kind] of (["paths", "text", "legacy"] as const).entries()) {
    const led = new Led({
      name: `LED_${kind}`,
      pcbX: (col - 1) * 15,
      pinLabels: { pin1: ["cathode"], pin2: ["anode"] },
    })
    const footprint = new Footprint({})
    const importedJson = fp
      .string("smdpads2_p2.4mm_pw0.8mm_ph0.8mm_cathodepin1")
      .circuitJson()
      .flatMap<AnyCircuitElement>((note) => {
        if (note.type === "pcb_fabrication_note_text") {
          return kind === "text" && note.text === "-"
            ? [{ ...note, text: "K" }]
            : []
        }
        if (note.type === "pcb_fabrication_note_path") {
          return kind === "text"
            ? []
            : [
                {
                  ...note,
                  is_polarity_marking: kind === "legacy" ? undefined : true,
                },
              ]
        }
        return [note]
      })
    const parsedJson = JSON.parse(JSON.stringify(importedJson)).map(
      (note: unknown) => any_circuit_element.parse(note),
    )
    footprint.addAll(
      createComponentsFromCircuitJson(
        {
          sourcePortOwner: led,
          componentName: led.name!,
          componentRotation: "0",
        },
        parsedJson,
      ),
    )
    led.add(footprint)
    board.add(led)
  }
  circuit.add(board)
  await circuit.renderUntilSettled()
  for (const kind of ["paths", "text", "legacy"] as const) {
    const led = circuit.selectOne(`.LED_${kind}`) as Led
    const filter = { pcb_component_id: led.pcb_component_id! }
    const paths = circuit.db.pcb_fabrication_note_path.list(filter)
    const texts = circuit.db.pcb_fabrication_note_text.list(filter)
    expect(paths).toHaveLength(kind === "paths" ? 4 : kind === "text" ? 0 : 8)
    expect(texts).toHaveLength(kind === "text" ? 1 : 0)
    expect(
      [...paths, ...texts].filter((note) => note.is_polarity_marking),
    ).toHaveLength(kind === "text" ? 1 : 4)
    const exported = [...paths, ...texts].map((note) =>
      any_circuit_element.parse(JSON.parse(JSON.stringify(note))),
    )
    expect(exported).toEqual([...paths, ...texts])
    led.updatePcbComponentSizeCalculation()
    expect(circuit.db.pcb_fabrication_note_path.list(filter)).toHaveLength(
      paths.length,
    )
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
