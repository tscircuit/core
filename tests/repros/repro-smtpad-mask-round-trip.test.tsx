import { expect, test } from "bun:test"
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
