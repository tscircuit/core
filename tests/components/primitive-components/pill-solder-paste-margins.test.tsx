import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pill paste margins expand, preserve, shrink, and suppress apertures", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={6}>
      <smtpad
        shape="pill"
        width={2}
        height={1}
        radius={0.5}
        solderPasteMargin={0.1}
        pcbX={-6}
        portHints={[]}
      />
      <smtpad
        shape="pill"
        width={2}
        height={1}
        radius={0.5}
        solderPasteMargin={0}
        pcbX={-3}
        portHints={[]}
      />
      <smtpad
        shape="rotated_pill"
        ccwRotation={45}
        width={2}
        height={1}
        radius={0.5}
        solderPasteMargin={-0.1}
        portHints={[]}
      />
      <smtpad
        shape="pill"
        width={2}
        height={1}
        radius={0.5}
        solderPasteMargin={-0.5}
        pcbX={3}
        portHints={[]}
      />
      <smtpad
        shape="rotated_pill"
        ccwRotation={45}
        width={2}
        height={1}
        radius={0.5}
        solderPasteMargin={-2}
        pcbX={6}
        portHints={[]}
      />
      <pcbnotetext
        text="Paste margins: +0.1 / 0 / -0.1 / -0.5 / -2 mm"
        pcbY={2}
        fontSize={0.35}
      />
    </board>,
  )
  circuit.render()
  const paste = circuit.db.pcb_solder_paste.list()
  expect(paste).toHaveLength(3)
  expect(paste[0]).toMatchObject({
    shape: "pill",
    x: -6,
    width: 2.2,
    height: 1.2,
    radius: 0.6,
  })
  expect(paste[1]).toMatchObject({
    shape: "pill",
    x: -3,
    width: 2,
    height: 1,
    radius: 0.5,
  })
  expect(paste[2]).toMatchObject({
    shape: "rotated_pill",
    x: 0,
    width: 1.8,
    height: 0.8,
    radius: 0.4,
    ccw_rotation: 45,
  })
})
