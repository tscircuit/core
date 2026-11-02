import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a real PCB antenna keeps its feed pad masked after save and import", async () => {
  const { circuit: authored } = getTestFixture()
  authored.add(
    <board width={26} height={18} routingDisabled schematicDisabled>
      <antenna
        name="ANT1"
        antennaShape="2.4ghz_meandered_monopole"
        pcbX={-7.5}
        pcbY={-2}
      />
    </board>,
  )
  await authored.renderUntilSettled()

  // Antenna generates this masked 0.8 mm feed pad itself. The fixture does not
  // supply a custom footprint, override mask settings, or manufacture pad JSON.
  expect(authored.db.pcb_smtpad.list()).toHaveLength(1)
  const authoredFeed = authored.db.pcb_smtpad
    .list()
    .find((pad) => pad.shape === "rect")!
  expect(authoredFeed).toMatchObject({
    shape: "rect",
    width: 0.8,
    height: 0.8,
    is_covered_with_solder_mask: true,
  })
  expect(authored.db.pcb_trace.list()[0].is_antenna_trace).toBe(true)

  const savedJson: AnyCircuitElement[] = JSON.parse(
    JSON.stringify(authored.getCircuitJson()),
  )
  const { circuit: imported } = getTestFixture()
  imported.add(
    <board width={26} height={18} routingDisabled schematicDisabled>
      <subcircuit name="SAVED_BOARD" circuitJson={savedJson} />
    </board>,
  )
  await imported.renderUntilSettled()

  const importedFeed = imported.db.pcb_smtpad
    .list()
    .find((pad) => pad.shape === "rect")!
  const status = importedFeed.is_covered_with_solder_mask ? "MASKED" : "EXPOSED"

  // Snapshot annotations use board-world points in mm: +X right, +Y up,
  // +Z above (right-handed).
  const noteProps = {
    type: "pcb_note_text" as const,
    font: "tscircuit2024" as const,
    anchor_alignment: "center" as const,
    layer: "top" as const,
  }
  await expect([
    ...imported.getCircuitJson(),
    {
      ...noteProps,
      pcb_note_text_id: "snapshot_title",
      text: "IMPORTED: ANT1 / 2.4 GHz meandered monopole",
      anchor_position: { x: 0, y: 7.5 },
      font_size: 0.55,
    },
    {
      ...noteProps,
      pcb_note_text_id: "snapshot_feed_status",
      text: `Feed pad: ${status} (expected MASKED)`,
      anchor_position: { x: 0, y: -5.5 },
      font_size: 0.6,
    },
    {
      ...noteProps,
      pcb_note_text_id: "snapshot_keepout_legend",
      text: "Hatching = copper keepout; square = feed pad",
      anchor_position: { x: 0, y: -7.2 },
      font_size: 0.35,
    },
  ]).toMatchPcbSnapshot(
    import.meta.path.replace(".test.tsx", "-imported-board.test.tsx"),
    {
      layer: "top",
      showSolderMask: true,
      includeVersion: false,
      shouldDrawRatsNest: false,
      shouldDrawErrors: false,
      width: 1000,
      height: 700,
    },
  )
  expect(imported.db.pcb_smtpad.list()).toHaveLength(1)
  expect(importedFeed.is_covered_with_solder_mask).toBe(true)
  expect(imported.db.pcb_solder_paste.list()).toHaveLength(0)
}, 60_000)
