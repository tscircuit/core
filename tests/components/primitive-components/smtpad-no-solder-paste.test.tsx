import { expect, test } from "bun:test"
import { Fragment } from "react"
import type { SmtPadProps } from "@tscircuit/props"
import { SmtPad } from "lib/components/primitive-components/SmtPad"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("noSolderPaste suppresses paste on every shape without covering copper", async () => {
  const { circuit } = getTestFixture()
  const shapes: SmtPadProps[] = [
    { shape: "rect", width: 2, height: 1.4 },
    { shape: "rotated_rect", width: 2, height: 1.4, ccwRotation: 30 },
    { shape: "circle", radius: 0.8 },
    { shape: "pill", width: 2, height: 1.4, radius: 0.7 },
    {
      shape: "rotated_pill",
      width: 2,
      height: 1.4,
      radius: 0.7,
      ccwRotation: 30,
    },
    {
      shape: "polygon",
      points: [
        { x: -1, y: -0.7 },
        { x: 1, y: -0.7 },
        { x: 0, y: 0.7 },
      ],
    },
  ]
  const modes = [
    {
      label: "default",
      noSolderPaste: undefined,
      coveredWithSolderMask: false,
    },
    { label: "false", noSolderPaste: false, coveredWithSolderMask: false },
    { label: "true", noSolderPaste: true, coveredWithSolderMask: false },
    {
      label: "true + margin",
      noSolderPaste: true,
      coveredWithSolderMask: false,
      solderPasteMargin: 0.2,
    },
    {
      label: "false + covered",
      noSolderPaste: false,
      coveredWithSolderMask: true,
    },
    {
      label: "true + covered",
      noSolderPaste: true,
      coveredWithSolderMask: true,
    },
  ]
  circuit.add(
    <board width={44} height={64}>
      {shapes.map((shape, shapeIndex) => (
        <Fragment key={shape.shape}>
          <pcbnotetext
            text={shape.shape}
            pcbX={-5 + shapeIndex * 4.5}
            pcbY={31}
            fontSize={0.6}
          />
        </Fragment>
      ))}
      {(["top", "bottom"] as const).flatMap((layer, layerIndex) =>
        modes.flatMap((mode, modeIndex) => {
          const pcbY = 28 - (layerIndex * modes.length + modeIndex) * 5
          return [
            <Fragment key={`${layer}-${modeIndex}`}>
              <pcbnotetext
                text={`${layer}: ${mode.label}`}
                pcbX={-14}
                pcbY={pcbY}
                fontSize={0.9}
              />
            </Fragment>,
            ...shapes.map((shape, shapeIndex) => (
              <chip
                key={`${layer}-${modeIndex}-${shape.shape}`}
                name={`U${layerIndex}_${modeIndex}_${shapeIndex}`}
                layer={layer}
                pcbX={-5 + shapeIndex * 4.5}
                pcbY={pcbY}
                pinLabels={{ 1: "PAD" }}
                footprint={
                  <footprint>
                    <smtpad
                      {...shape}
                      noSolderPaste={mode.noSolderPaste}
                      coveredWithSolderMask={mode.coveredWithSolderMask}
                      solderPasteMargin={mode.solderPasteMargin}
                      solderMaskMargin={0.1}
                      portHints={["pin1"]}
                    />
                  </footprint>
                }
              />
            )),
          ]
        }),
      )}
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(72)
  expect(circuit.db.pcb_solder_paste.list()).toHaveLength(24)
  for (const [layerIndex, layer] of (["top", "bottom"] as const).entries()) {
    for (const [modeIndex, mode] of modes.entries()) {
      for (const [shapeIndex] of shapes.entries()) {
        const smtpad = circuit.selectOne(
          `.U${layerIndex}_${modeIndex}_${shapeIndex} smtpad`,
        ) as SmtPad
        const pad = circuit.db.pcb_smtpad.get(smtpad.pcb_smtpad_id!)!
        expect(pad.layer).toBe(layer)
        expect(pad.is_covered_with_solder_mask).toBe(mode.coveredWithSolderMask)
        expect(pad.soldermask_margin).toBe(0.1)
        const paste = circuit.db.pcb_solder_paste
          .list()
          .filter((paste) => paste.pcb_smtpad_id === pad.pcb_smtpad_id)
        expect(paste).toHaveLength(
          mode.noSolderPaste || mode.coveredWithSolderMask ? 0 : 1,
        )
      }
    }
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
    showSolderMask: true,
  })
})
