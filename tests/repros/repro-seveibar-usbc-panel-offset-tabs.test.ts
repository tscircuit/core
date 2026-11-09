import { beforeAll, expect, test } from "bun:test"
import { getManifoldModule, type CrossSection } from "@tscircuit/manifold-2d"
import type { CircuitJson, PcbPanel } from "circuit-json"
import { generatePanelTabsAndMouseBites } from "lib/utils/panels/generate-panel-tabs-and-mouse-bites"
import "tests/fixtures/extend-expect-circuit-snapshot"
import { getPanelMaterial } from "tests/fixtures/get-panel-material"

let material: CrossSection
let dialLeftBridge: { x: number; y: number }

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
  expect(boards).toHaveLength(10)
  expect(
    captured.filter((element) => element.type === "pcb_trace"),
  ).toHaveLength(1426)
  expect(
    captured.filter((element) => element.type === "pcb_smtpad"),
  ).toHaveLength(1068)

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
  ]
  // A native PCB snapshot: actual traces, pads, vias, components and silkscreen.
  // Await it outside test.failing so rendering failures cannot satisfy the repro.
  await expect(circuitJson).toMatchPcbSnapshot(import.meta.path, {
    width: 1120,
    height: 1400,
  })
  material = await getPanelMaterial(
    panel,
    tabCutouts,
    circuitJson.filter((element) => element.type === "pcb_hole"),
  )
  const dial = boards.find(
    (board) => board.pcb_board_id === "dial_pcb_board_0",
  )!
  expect(dial).toMatchObject({ center: { x: 9, y: -14 }, width: 24 })
  // Midway across the real 3 mm channel between the dial and display boards.
  // The display's independently centered right-edge tab is at another height.
  dialLeftBridge = {
    x: dial.center.x - dial.width! / 2 - boardGap / 2,
    y: dial.center.y,
  }
})

test.failing(
  "Seve's routed USB-C panel preserves the dial board's left support tab",
  async () => {
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
  },
)
