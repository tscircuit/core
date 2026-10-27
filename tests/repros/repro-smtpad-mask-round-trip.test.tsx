import { expect, test } from "bun:test"
import { getBoundsFromPoints } from "@tscircuit/math-utils"
import type { AnyCircuitElement } from "circuit-json"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saving and importing native SMT pads preserves solder mask settings", async () => {
  const maskRows = [
    { label: "Covered: no mask opening", coveredWithSolderMask: true },
    {
      label: "Exposed: mask margin +0.20 mm",
      coveredWithSolderMask: false,
      solderMaskMargin: 0.2,
    },
    {
      label: "Exposed: mask margin 0 mm",
      coveredWithSolderMask: false,
      solderMaskMargin: 0,
    },
    {
      label: "Exposed: mask margin -0.15 mm",
      coveredWithSolderMask: false,
      solderMaskMargin: -0.15,
    },
    { label: "Default: exposed, no explicit margin" },
  ]
  const padGeometries = [
    { shape: "rect" as const, width: 1.8, height: 1 },
    { shape: "circle" as const, radius: 0.65 },
    { shape: "pill" as const, width: 2, height: 1, radius: 0.5 },
    { shape: "rotated_rect" as const, width: 1.8, height: 1, ccwRotation: 30 },
    {
      shape: "rotated_pill" as const,
      width: 2,
      height: 1,
      radius: 0.5,
      ccwRotation: 30,
    },
    {
      shape: "polygon" as const,
      points: [
        { x: -0.9, y: -0.5 },
        { x: 0.9, y: -0.5 },
        { x: 0.9, y: 0.2 },
        { x: 0.3, y: 0.5 },
        { x: -0.9, y: 0.5 },
      ],
    },
  ]
  const shapes = padGeometries.map((pad) => pad.shape)
  const layers = ["top", "bottom"] as const
  const { circuit: authored } = getTestFixture()

  // Footprint-local points in mm: +X right, +Y up, +Z above (right-handed).
  // Bottom-layer chips use the normal footprint transform; both sides are tested.
  authored.add(
    <board width={28} height={22} routingDisabled schematicDisabled>
      {layers.map((layer) => (
        <chip
          key={layer}
          name={layer === "top" ? "TOP_PADS" : "BOTTOM_PADS"}
          layer={layer}
          footprint={
            <footprint>
              {maskRows.map((maskRow, row) => {
                const padProps = {
                  layer: "top" as const,
                  pcbY: 7 - row * 3.5,
                  coveredWithSolderMask: maskRow.coveredWithSolderMask,
                  solderMaskMargin: maskRow.solderMaskMargin,
                }
                return (
                  <Fragment key={maskRow.label}>
                    {padGeometries.map((geometry, column) => (
                      <Fragment key={geometry.shape}>
                        <smtpad
                          {...geometry}
                          {...padProps}
                          pcbX={column * 4 - 10}
                          portHints={[`pin${row * 6 + column + 1}`]}
                        />
                      </Fragment>
                    ))}
                  </Fragment>
                )
              })}
            </footprint>
          }
        />
      ))}
      {layers.map((layer) => (
        <Fragment key={layer}>
          <pcbnotetext
            layer={layer}
            pcbY={10}
            fontSize={0.55}
            text="Solder mask must survive save / import"
          />
          {shapes.map((shape, column) => (
            <Fragment key={shape}>
              <pcbnotetext
                layer={layer}
                pcbX={(column * 4 - 10) * (layer === "top" ? 1 : -1)}
                pcbY={-9}
                fontSize={0.35}
                text={shape}
              />
            </Fragment>
          ))}
          {maskRows.map((maskRow, row) => (
            <Fragment key={maskRow.label}>
              <pcbnotetext
                layer={layer}
                pcbY={8.3 - row * 3.5}
                fontSize={0.4}
                text={maskRow.label}
              />
            </Fragment>
          ))}
        </Fragment>
      ))}
    </board>,
  )
  await authored.renderUntilSettled()

  // Exercise the public saved-board import, including a real JSON serialization.
  const savedJson: AnyCircuitElement[] = JSON.parse(
    JSON.stringify(authored.getCircuitJson()),
  )
  const savedJsonBeforeImport = JSON.stringify(savedJson)
  const { circuit: imported } = getTestFixture()
  imported.add(
    <board width={28} height={22} routingDisabled schematicDisabled>
      <subcircuit name="SAVED_BOARD" circuitJson={savedJson} />
    </board>,
  )
  await imported.renderUntilSettled()

  // Record the actual broken result before asserting the round-trip invariant.
  // Each SVG is rendered separately so solder-mask clip IDs cannot collide.
  for (const [stage, circuit] of [
    ["authored", authored],
    ["imported", imported],
  ] as const) {
    for (const layer of layers) {
      // Supply the same explanatory legend to each view, independently of
      // PCB-note import behavior. Only pad rendering is under test here.
      const annotations = savedJson
        .filter(
          (element) =>
            element.type === "pcb_note_text" && element.layer === layer,
        )
        .map((note) =>
          note.type === "pcb_note_text" && note.anchor_position.y === 10
            ? {
                ...note,
                text: `${stage.toUpperCase()} / ${layer.toUpperCase()}: solder mask`,
              }
            : note,
        )
      const snapshotJson = [
        ...circuit
          .getCircuitJson()
          .filter((element) => element.type !== "pcb_note_text"),
        ...annotations,
        ...circuit.db.pcb_smtpad
          .list()
          .filter((pad) => pad.layer === layer)
          .map((pad) => {
            // Label emitted board-world geometry, in mm (+X right, +Y up).
            const bounds =
              pad.shape === "polygon" ? getBoundsFromPoints(pad.points)! : null
            const x = bounds ? (bounds.minX + bounds.maxX) / 2 : pad.x!
            const y = bounds ? (bounds.minY + bounds.maxY) / 2 : pad.y!
            return {
              ...authored.db.pcb_note_text.list()[0],
              pcb_note_text_id: `mask_settings_${pad.pcb_smtpad_id}`,
              layer,
              anchor_position: { x, y: y - 1.05 },
              font_size: 0.3,
              text: `${pad.is_covered_with_solder_mask ? "covered" : "open"} / m=${pad.soldermask_margin ?? "default"}`,
            }
          }),
      ]
      await expect(snapshotJson).toMatchPcbSnapshot(
        import.meta.path.replace(".test.tsx", `-${stage}-${layer}.test.tsx`),
        {
          layer,
          showSolderMask: true,
          includeVersion: false,
          shouldDrawRatsNest: false,
          width: 1000,
          height: 800,
        },
      )
    }
  }

  const getMaskSettings = (circuitJson: AnyCircuitElement[]) =>
    circuitJson
      .filter((element) => element.type === "pcb_smtpad")
      .map((pad) => ({
        shape: pad.shape,
        layer: pad.layer,
        pin: pad.port_hints?.join(","),
        covered: pad.is_covered_with_solder_mask,
        margin: pad.soldermask_margin,
      }))
      .sort((a, b) =>
        `${a.layer}:${a.pin}`.localeCompare(`${b.layer}:${b.pin}`),
      )

  const authoredSettings = getMaskSettings(savedJson)
  expect(authoredSettings).toHaveLength(60)
  expect(new Set(authoredSettings.map((pad) => pad.shape))).toEqual(
    new Set(shapes),
  )
  expect(authoredSettings.filter((pad) => pad.covered)).toHaveLength(12)
  expect(JSON.stringify(savedJson)).toBe(savedJsonBeforeImport)
  expect(getMaskSettings(imported.getCircuitJson())).toEqual(authoredSettings)
}, 60_000)
