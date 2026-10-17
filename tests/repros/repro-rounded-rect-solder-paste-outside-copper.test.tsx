import { beforeAll, expect, test } from "bun:test"
import Flatten from "@flatten-js/core"
import { getSmtPadPolygon } from "@tscircuit/circuit-json-util"
import type { PcbSmtPad } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

let roundedCornerCoverage: boolean[]
beforeAll(async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={11} schematicDisabled routingDisabled>
      <smtpad
        shape="rect"
        width={2}
        height={1}
        cornerRadius={0.5}
        solderPasteMargin={0}
        portHints={[]}
        pcbX={-4}
        pcbY={1.5}
      />
      <smtpad
        shape="rotated_rect"
        width={2}
        height={1}
        ccwRotation={45}
        cornerRadius={0.5}
        solderPasteMargin={0}
        portHints={[]}
        pcbX={-4}
        pcbY={-1.5}
      />
      <smtpad
        shape="pill"
        width={2}
        height={1}
        radius={0.5}
        solderPasteMargin={0}
        portHints={[]}
        pcbX={4}
        pcbY={1.5}
      />
      <smtpad
        shape="rotated_pill"
        width={2}
        height={1}
        radius={0.5}
        ccwRotation={45}
        solderPasteMargin={0}
        portHints={[]}
        pcbX={4}
        pcbY={-1.5}
      />
      <pcbnotetext
        pcbY={4.7}
        fontSize={0.5}
        text="Zero-margin paste should follow copper"
      />
      <pcbnotetext
        pcbX={-4}
        pcbY={3}
        fontSize={0.4}
        text="Rounded rectangles"
      />
      <pcbnotetext
        pcbX={4}
        pcbY={3}
        fontSize={0.4}
        text="Equivalent pill controls"
      />
      <pcbnotetext
        pcbY={-3.5}
        fontSize={0.4}
        text="Left: square paste corners extend beyond copper"
      />
      <pcbnotetext
        pcbY={-4.5}
        fontSize={0.4}
        text="Right: rounded paste remains inside copper"
      />
    </board>,
  )
  circuit.render()
  const copper = circuit.db.pcb_smtpad.list()
  const paste = circuit.db.pcb_solder_paste.list()
  expect(copper).toHaveLength(4)
  expect(paste).toHaveLength(4)
  const coverage = copper.map((pad) => {
    if (pad.shape === "circle" || pad.shape === "polygon")
      throw new Error("Expected a rectangular or pill-shaped pad")
    const radians =
      (("ccw_rotation" in pad ? pad.ccw_rotation : 0) * Math.PI) / 180
    // A board-world point, obtained from a pad-local point in mm (+X right,
    // +Y up). It lies near the bounding-box corner, outside rounded copper.
    const localX = pad.width / 2 - 0.05
    const localY = pad.height / 2 - 0.05
    const point = new Flatten.Point(
      pad.x + localX * Math.cos(radians) - localY * Math.sin(radians),
      pad.y + localX * Math.sin(radians) + localY * Math.cos(radians),
    )
    expect(getSmtPadPolygon(pad).contains(point)).toBe(false)
    const aperture = paste.find(
      (element) => element.pcb_smtpad_id === pad.pcb_smtpad_id,
    )!
    // Reuse the published geometric interpreter; only the identity/type is
    // adapted, while the emitted aperture dimensions and shape are unchanged.
    const pasteGeometry = {
      ...aperture,
      type: "pcb_smtpad",
      pcb_smtpad_id: "paste_geometry",
    } as PcbSmtPad
    return getSmtPadPolygon(pasteGeometry).contains(point)
  })
  expect(coverage.slice(2)).toEqual([false, false])
  roundedCornerCoverage = coverage.slice(0, 2)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
    width: 1000,
    height: 750,
  })
})

const regression =
  process.env.TSCIRCUIT_VERIFY_SIBLING_REPRO === "1" ? test : test.failing
regression(
  "zero-margin rounded-rectangle paste does not cover points outside copper",
  () => {
    expect(roundedCornerCoverage).toEqual([false, false])
  },
)
