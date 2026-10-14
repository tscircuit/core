import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import "tests/fixtures/extend-expect-any-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const isPcbNote = (element: AnyCircuitElement) =>
  element.type === "pcb_note_text" ||
  element.type === "pcb_note_rect" ||
  element.type === "pcb_note_path" ||
  element.type === "pcb_note_line"

/**
 * Render emitted board-world points (mm, +X right, +Y top, +Z above,
 * right-handed) into SVG pixels. Notes are overlays in the SVG renderer,
 * so select them by their actual Circuit JSON layer for each panel.
 */
const createLayerPanel = (
  circuitJson: AnyCircuitElement[],
  label: string,
  layer: "top" | "bottom",
) => {
  const noteCount = circuitJson.filter(
    (element) => isPcbNote(element) && element.layer === layer,
  ).length
  const heading = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="48">
    <rect width="640" height="48" fill="#151b23" />
    <text x="320" y="30" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#ffffff">${label}: ${layer.toUpperCase()} (${noteCount} notes)</text>
  </svg>`
  const pcbSvg = convertCircuitJsonToPcbSvg(
    circuitJson.filter(
      (element) => !isPcbNote(element) || element.layer === layer,
    ),
    {
      layer,
      width: 640,
      height: 420,
      viewport: { minX: -12, minY: -9, maxX: 12, maxY: 9 },
      shouldDrawErrors: false,
      showCourtyards: false,
      showFabricationNotes: false,
      includeVersion: false,
    },
  )
  return stackSvgsVertically([heading, pcbSvg], {
    gap: 0,
    normalizeSize: false,
  })
}

test.failing(
  "Circuit JSON footprint import preserves bottom PCB note layers",
  async () => {
    const { circuit: sourceCircuit } = getTestFixture()
    sourceCircuit.add(
      <board width={24} height={18} routingDisabled schematicDisabled>
        <chip
          name="U_SOURCE"
          pcbX={0}
          pcbY={0}
          footprint={
            <footprint>
              <smtpad shape="rect" width={1} height={1} portHints={["1"]} />
              <pcbnoterect
                pcbX={-5}
                pcbY={3}
                width={4}
                height={2}
                strokeWidth={0.25}
                color="#38bdf8"
                layer="bottom"
              />
              <pcbnotepath
                route={[
                  { x: 3, y: 2 },
                  { x: 5, y: 4 },
                  { x: 7, y: 2 },
                ]}
                strokeWidth={0.25}
                color="#c084fc"
                layer="bottom"
              />
              <pcbnoteline
                x1={-7}
                y1={-3}
                x2={-3}
                y2={-3}
                strokeWidth={0.25}
                color="#fb923c"
                layer="bottom"
              />
              <pcbnotetext
                pcbX={5}
                pcbY={-3}
                text="BOTTOM NOTE"
                fontSize={0.8}
                color="#4ade80"
                layer="bottom"
              />
            </footprint>
          }
        />
      </board>,
    )
    await sourceCircuit.renderUntilSettled()
    const sourceCircuitJson = sourceCircuit.getCircuitJson()
    const sourceNotes = sourceCircuitJson.filter(isPcbNote)
    const footprintCircuitJson = sourceCircuitJson.filter(
      (element) => isPcbNote(element) || element.type === "pcb_smtpad",
    )

    const { circuit: importedCircuit } = getTestFixture()
    importedCircuit.add(
      <board width={24} height={18} routingDisabled schematicDisabled>
        <chip name="U_IMPORTED" pcbX={0} pcbY={0} />
      </board>,
    )
    const importedFootprint = new Footprint({})
    for (const primitive of createComponentsFromCircuitJson(
      { componentName: "U_IMPORTED", componentRotation: "0" },
      footprintCircuitJson,
    )) {
      importedFootprint.add(primitive)
    }
    importedCircuit.selectOne(".U_IMPORTED")!.add(importedFootprint)
    await importedCircuit.renderUntilSettled()
    const importedCircuitJson = importedCircuit.getCircuitJson()
    const importedNotes = importedCircuitJson.filter(isPcbNote)

    const comparisonSvg = stackSvgsVertically(
      [
        stackSvgsHorizontally(
          [
            createLayerPanel(sourceCircuitJson, "Source", "top"),
            createLayerPanel(importedCircuitJson, "Imported", "top"),
          ],
          { gap: 16, normalizeSize: false },
        ),
        stackSvgsHorizontally(
          [
            createLayerPanel(sourceCircuitJson, "Source", "bottom"),
            createLayerPanel(importedCircuitJson, "Imported", "bottom"),
          ],
          { gap: 16, normalizeSize: false },
        ),
      ],
      { gap: 16, normalizeSize: false },
    )
    await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)

    expect(sourceNotes.map((note) => note.layer)).toEqual([
      "bottom",
      "bottom",
      "bottom",
      "bottom",
    ])
    expect(
      importedNotes.map((note) => ({ type: note.type, layer: note.layer })),
    ).toEqual(
      sourceNotes.map((note) => ({ type: note.type, layer: note.layer })),
    )
  },
)
