import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const sideMarginPad = (
  <smtpad
    shape="rect"
    width="1mm"
    height="0.6mm"
    portHints={["1"]}
    solderMaskMarginLeft="0.3mm"
    solderMaskMarginRight="0.1mm"
    solderMaskMarginTop="0.2mm"
    solderMaskMarginBottom="0.05mm"
  />
)

const renderPad = (chipProps: Record<string, unknown> = {}) => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={<footprint>{sideMarginPad}</footprint>}
        {...chipProps}
      />
    </board>,
  )
  circuit.render()
  return { circuit, pad: circuit.db.pcb_smtpad.list()[0] }
}

test("smtpad passes per-side solder mask margins to pcb_smtpad", () => {
  const { circuit, pad } = renderPad()
  expect(pad).toMatchObject({
    shape: "rect",
    soldermask_margin_left: 0.3,
    soldermask_margin_right: 0.1,
    soldermask_margin_top: 0.2,
    soldermask_margin_bottom: 0.05,
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("smtpad per-side margins follow a 90 degree rotation", () => {
  const { pad } = renderPad({ pcbRotation: 90 })
  expect(pad).toMatchObject({ shape: "rect", width: 0.6, height: 1 })
  // pad-local left (-x) faces the board's -y after a 90 degree ccw turn
  expect(pad).toMatchObject({
    soldermask_margin_bottom: 0.3,
    soldermask_margin_top: 0.1,
    soldermask_margin_left: 0.2,
    soldermask_margin_right: 0.05,
  })
})

test("smtpad per-side margins follow the bottom-side flip", () => {
  const { pad } = renderPad({ layer: "bottom" })
  expect(pad.layer).toBe("bottom")
  // bottom placement mirrors x (a pad at pcbX=2 lands at x=-2), so left and right swap
  expect(pad).toMatchObject({
    soldermask_margin_left: 0.1,
    soldermask_margin_right: 0.3,
    soldermask_margin_top: 0.2,
    soldermask_margin_bottom: 0.05,
  })
})

test("smtpad per-side margins follow a flip and a 90 degree rotation together", () => {
  const { pad } = renderPad({ layer: "bottom", pcbRotation: 90 })
  expect(pad).toMatchObject({
    shape: "rect",
    soldermask_margin_top: 0.3,
    soldermask_margin_bottom: 0.1,
    soldermask_margin_left: 0.2,
    soldermask_margin_right: 0.05,
  })
})

test("smtpad per-side margins stay in the pad frame for rotated_rect output", () => {
  const { pad } = renderPad({ pcbRotation: 45 })
  expect(pad).toMatchObject({
    shape: "rotated_rect",
    ccw_rotation: 45,
    soldermask_margin_left: 0.3,
    soldermask_margin_right: 0.1,
    soldermask_margin_top: 0.2,
    soldermask_margin_bottom: 0.05,
  })
})

test("smtpad without per-side margins emits none", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              portHints={["1"]}
              solderMaskMargin="0.1mm"
            />
          </footprint>
        }
      />
    </board>,
  )
  circuit.render()
  const pad = circuit.db.pcb_smtpad.list()[0]
  expect(pad.soldermask_margin).toBe(0.1)
  expect(
    Object.keys(pad).filter((k) => k.startsWith("soldermask_margin_")),
  ).toEqual([])
})

test("rotated_rect smtpad per-side margins follow its rotation and the bottom-side flip", () => {
  const render = (layer: "top" | "bottom") => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width="10mm" height="10mm">
        <chip
          name="U1"
          layer={layer}
          footprint={
            <footprint>
              <smtpad
                shape="rotated_rect"
                width="1mm"
                height="0.6mm"
                ccwRotation={30}
                portHints={["1"]}
                solderMaskMarginLeft="0.3mm"
                solderMaskMarginTop="0.2mm"
              />
            </footprint>
          }
        />
      </board>,
    )
    circuit.render()
    return circuit.db.pcb_smtpad.list()[0]
  }

  expect(render("top")).toMatchObject({
    shape: "rotated_rect",
    ccw_rotation: 30,
    soldermask_margin_left: 0.3,
    soldermask_margin_top: 0.2,
  })
  // The mirrored pad is emitted at 150 degrees (same outline as 330). In that
  // frame the pad's own left edge is still on the left and its top edge faces
  // the emitted frame's bottom.
  expect(render("bottom")).toMatchObject({
    shape: "rotated_rect",
    ccw_rotation: 150,
    soldermask_margin_left: 0.3,
    soldermask_margin_bottom: 0.2,
  })
})
