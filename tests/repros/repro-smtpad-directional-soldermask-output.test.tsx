import { beforeAll, expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()
const margins = {
  solderMaskMargin: 0.05,
  solderMaskMarginLeft: 0,
  solderMaskMarginTop: 0.1,
  solderMaskMarginRight: -0.05,
  solderMaskMarginBottom: 0.2,
}

beforeAll(async () => {
  circuit.add(
    <board width={24} height={12} schematicDisabled routingDisabled>
      <smtpad
        shape="rect"
        width={3}
        height={2}
        pcbX={-5}
        portHints={[]}
        {...margins}
      />
      <smtpad
        shape="rotated_rect"
        width={3}
        height={2}
        ccwRotation={30}
        pcbX={5}
        portHints={[]}
        {...margins}
      />
      <pcbnotetext
        text="rect / rotated_rect: per-side mask margins"
        pcbY={4}
        fontSize={0.6}
      />
      <pcbnotetext text="L=0 T=0.1 R=-0.05 B=0.2 mm" pcbY={-3} fontSize={0.6} />
      <pcbnotetext
        text="Only uniform margin 0.05 is currently emitted"
        pcbY={-4.5}
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_smtpad.list()).toMatchObject([
    { shape: "rect", soldermask_margin: 0.05 },
    { shape: "rotated_rect", soldermask_margin: 0.05 },
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
  })
})

test.failing(
  "rectangular pads emit all four directional soldermask margins",
  () => {
    expect(circuit.db.pcb_smtpad.list()).toMatchObject(
      ["rect", "rotated_rect"].map((shape) => ({
        shape,
        soldermask_margin_left: 0,
        soldermask_margin_top: 0.1,
        soldermask_margin_right: -0.05,
        soldermask_margin_bottom: 0.2,
      })),
    )
  },
)
