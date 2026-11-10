import { beforeAll, expect, test } from "bun:test"
import { type CrossSection, getManifoldModule } from "@tscircuit/manifold-2d"
import type { CircuitJson, PcbHoleCircle, PcbPanel, Point } from "circuit-json"
import { generatePanelTabsAndMouseBites } from "lib/utils/panels/generate-panel-tabs-and-mouse-bites"
import "tests/fixtures/extend-expect-circuit-snapshot"
import { getPanelMaterial } from "tests/fixtures/get-panel-material"

let material: CrossSection
let dialLeftBridge: Point
let dialTabRoots: [Point, Point]
let panelMouseBiteHoles: PcbHoleCircle[]
let displayTabMinimumY: number
const routingWidthMm = 2

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
  const display = boards.find(
    (board) => board.pcb_board_id === "display_pcb_board_0",
  )!
  displayTabMinimumY = display.center.y - display.height! / 2
  dialTabRoots = [
    { x: dial.center.x - dial.width! / 2, y: dial.center.y },
    { x: display.center.x + display.width! / 2, y: dial.center.y },
  ]
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
      tabWidth: routingWidthMm,
      tabLength: 5,
      mouseBites: true,
    },
  )
  panelMouseBiteHoles = mouseBiteHoles
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
      text: "Yellow box: DIAL tab needs mouse bites at both ends",
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

test("Seve's routed USB-C panel preserves and perforates both roots of the dial tab", async () => {
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
  const rows = dialTabRoots.map((root) =>
    panelMouseBiteHoles
      .filter(
        (hole) =>
          Math.abs(hole.x - root.x) < 1e-6 && Math.abs(hole.y - root.y) < 2.5,
      )
      .map((hole) => Number(hole.y.toFixed(6)))
      .sort(),
  )
  expect(rows[0]).toHaveLength(4)
  // The lowest drill lies below the display's bottom edge. Its far end is
  // the preserved tab's routed tip; the other three meet the display edge.
  expect(rows[1]).toEqual(rows[0]!.filter((y) => y >= displayTabMinimumY))
  const farRow = panelMouseBiteHoles
    .filter(
      (hole) =>
        hole.x >= dialTabRoots[0].x - 2 * routingWidthMm - 1e-6 &&
        hole.x <= dialTabRoots[1].x + 1e-6 &&
        Math.abs(hole.y - dialLeftBridge.y) < 2.5,
    )
    .map((hole) => Number(hole.y.toFixed(6)))
    .sort()
  expect(farRow).toEqual(rows[0])
})
