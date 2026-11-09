import { beforeAll, expect, test } from "bun:test"
import { type CrossSection, getManifoldModule } from "@tscircuit/manifold-2d"
import type { CircuitJson, PcbPanel, Point } from "circuit-json"
import { generatePanelTabsAndMouseBites } from "lib/utils/panels/generate-panel-tabs-and-mouse-bites"
import "tests/fixtures/extend-expect-circuit-snapshot"
import { getPanelMaterial } from "tests/fixtures/get-panel-material"

let material: CrossSection
let dialLeftBridge: Point

beforeAll(async () => {
  // Published routed PCB geometry, pinned to seveibar/basic-usbc-devices v0.0.7:
  // https://tscircuit.com/seveibar/basic-usbc-devices?version=0.0.7
  // See the adjacent source.json for the original file, hashes and extraction.
  // All positions remain in right-handed circuit-world mm (+X right/+Y up/+Z above).
  const captured = (await Bun.file(
    new URL(
      "./assets/seveibar-basic-usbc-panel4/panel4.circuit.json",
      import.meta.url,
    ),
  ).json()) as CircuitJson
  const boards = captured.filter((element) => element.type === "pcb_board")
  const panel: PcbPanel = {
    type: "pcb_panel",
    pcb_panel_id: "seveibar_usbc_panel4",
    center: { x: 0, y: 0 },
    width: 112,
    height: 140,
    thickness: 1.6,
    covered_with_solder_mask: true,
  }
  const boardGap = 3
  const dial = boards.find(
    (board) => board.pcb_board_id === "dial_pcb_board_0",
  )!
  // Midway across the real 3 mm channel between the dial and display boards.
  // The display's independently centered right-edge tab is at another height.
  dialLeftBridge = {
    x: dial.center.x - dial.width! / 2 - boardGap / 2,
    y: dial.center.y,
  }
  const { tabCutouts, mouseBiteHoles } = generatePanelTabsAndMouseBites(
    boards,
    {
      boardGap,
      tabWidth: 2,
      tabLength: 5,
      mouseBites: true,
    },
  )
  const circuitJson: CircuitJson = [
    ...captured,
    panel,
    ...tabCutouts.map((cutout) => ({
      ...cutout,
      pcb_panel_id: panel.pcb_panel_id,
    })),
    ...mouseBiteHoles,
    // Review annotations explain the regression without changing machining.
    {
      type: "pcb_note_text",
      pcb_note_text_id: "dial_support_tab_label",
      text: "Yellow box: DIAL support tab must remain uncut",
      anchor_position: { x: 0, y: 67 },
      anchor_alignment: "center",
      font: "tscircuit2024",
      font_size: 1.4,
      layer: "top",
      color: "#facc15",
    },
    {
      type: "pcb_note_path",
      pcb_note_path_id: "dial_support_tab_marker",
      route: [
        { x: dialLeftBridge.x - 2, y: dialLeftBridge.y - 3 },
        { x: dialLeftBridge.x + 2, y: dialLeftBridge.y - 3 },
        { x: dialLeftBridge.x + 2, y: dialLeftBridge.y + 3 },
        { x: dialLeftBridge.x - 2, y: dialLeftBridge.y + 3 },
        { x: dialLeftBridge.x - 2, y: dialLeftBridge.y - 3 },
      ],
      stroke_width: 0.15,
      layer: "top",
      color: "#facc15",
    },
  ]
  // A native PCB snapshot: actual traces, pads, vias, components and silkscreen.
  // Keep rendering failures independent of the physical support assertion.
  await expect(circuitJson).toMatchPcbSnapshot(import.meta.path, {
    width: 1120,
    height: 1400,
    showPcbNotes: true,
  })
  material = await getPanelMaterial({
    panel,
    cutouts: tabCutouts,
    holes: circuitJson.filter((element) => element.type === "pcb_hole"),
  })
})

test("Seve's routed USB-C panel preserves the dial board's left support tab", async () => {
  const { CrossSection } = await getManifoldModule()
  const probe = CrossSection.square(0.5, true).translate(
    dialLeftBridge.x,
    dialLeftBridge.y,
  )
  const bridgeMaterial = material.intersect(probe)
  const bridgeArea = bridgeMaterial.area()
  bridgeMaterial.delete()
  probe.delete()
  material.delete()
  expect(bridgeArea).toBeCloseTo(0.25, 6)
})
