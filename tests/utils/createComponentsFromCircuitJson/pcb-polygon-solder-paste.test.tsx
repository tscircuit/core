import { expect, test } from "bun:test"
import { any_circuit_element, type AnyCircuitElement } from "circuit-json"
import { Board } from "lib/components/normal-components/Board/Board"
import { Chip } from "lib/components/normal-components/Chip"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("inflated polygon pads preserve split paste apertures and inner openings", () => {
  const { circuit } = getTestFixture()
  const points = [
    { x: -3, y: -2 },
    { x: 3, y: -2 },
    { x: 3, y: 2 },
    { x: -3, y: 2 },
  ]
  const apertures = [
    {
      type: "pcb_solder_paste",
      pcb_solder_paste_id: "paste_left",
      pcb_smtpad_id: "pad_original",
      shape: "polygon",
      layer: "bottom",
      points: [
        { x: -2.8, y: -1.8 },
        { x: -0.2, y: -1.8 },
        { x: -0.2, y: 1.8 },
        { x: -2.8, y: 1.8 },
      ],
      holes: [
        [
          { x: -2, y: -0.5 },
          { x: -2, y: 0.5 },
          { x: -1, y: 0.5 },
          { x: -1, y: -0.5 },
        ],
      ],
    },
    {
      type: "pcb_solder_paste",
      pcb_solder_paste_id: "paste_right",
      pcb_smtpad_id: "pad_original",
      shape: "polygon",
      layer: "bottom",
      points: [
        { x: 0.2, y: -1.8 },
        { x: 2.8, y: -1.8 },
        { x: 2.8, y: 1.8 },
        { x: 0.2, y: 1.8 },
      ],
    },
  ] satisfies AnyCircuitElement[]
  const importedCircuitJson = [
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_original",
      shape: "polygon",
      layer: "bottom",
      points,
      port_hints: [],
    },
    ...apertures,
  ] satisfies AnyCircuitElement[]
  const originalCircuitJson = structuredClone(importedCircuitJson)
  const components = createComponentsFromCircuitJson(
    { componentName: "U1", componentRotation: "0" },
    importedCircuitJson,
  )
  const board = new Board({ width: 10, height: 8 })
  const chip = new Chip({ name: "U1", layer: "bottom" })
  const footprint = new Footprint({ originalLayer: "bottom" })
  circuit.add(board)
  board.add(chip)
  chip.add(footprint)
  for (const component of components) footprint.add(component)
  board.add(
    <pcbnotetext
      text="Inflated bottom paste: split apertures and inner opening"
      pcbY={3.3}
      fontSize={0.25}
    />,
  )
  circuit.render()
  const paste = circuit.db.pcb_solder_paste.list()
  expect(paste).toHaveLength(2)
  const pad = circuit.db.pcb_smtpad.list()[0]!
  for (const [index, aperture] of paste.entries()) {
    if (aperture.shape !== "polygon") throw new Error("Expected polygon paste")
    expect(aperture.points).toEqual(apertures[index]!.points)
    expect(aperture.holes).toEqual(apertures[index]!.holes)
    expect(aperture.layer).toBe("bottom")
    expect(aperture.pcb_smtpad_id).toBe(pad.pcb_smtpad_id)
    expect(any_circuit_element.safeParse(aperture).success).toBe(true)
  }
  expect(importedCircuitJson).toEqual(originalCircuitJson)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
