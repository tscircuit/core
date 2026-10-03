import { expect, test } from "bun:test"
import { getManifoldModule } from "@tscircuit/manifold-2d"
import { pcb_solder_paste } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("concave paste stays inside copper and expanded paste preserves an opening", async () => {
  const { circuit } = getTestFixture()
  const points = [
    { x: -3, y: -3 },
    { x: 3, y: -3 },
    { x: 3, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: -2 },
    { x: -2, y: -2 },
    { x: -2, y: 2 },
    { x: 1, y: 2 },
    { x: 1, y: 1 },
    { x: 3, y: 1 },
    { x: 3, y: 3 },
    { x: -3, y: 3 },
  ]
  circuit.add(
    <board width={22} height={12}>
      <smtpad shape="polygon" points={points} pcbX={-5} portHints={[]} />
      <smtpad
        shape="polygon"
        points={points}
        pcbX={5}
        solderPasteMargin={1.1}
        portHints={[]}
      />
      <pcbnotetext
        text="Default: clipped to copper / +1.1 mm: inner opening preserved"
        pcbY={5}
        fontSize={0.35}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const pads = circuit.db.pcb_smtpad.list()
  const apertures = circuit.db.pcb_solder_paste.list()
  expect(apertures).toHaveLength(2)
  const defaultPaste = apertures[0]!
  const expandedPaste = apertures[1]!
  const copper = pads[0]!
  if (
    defaultPaste.shape !== "polygon" ||
    expandedPaste.shape !== "polygon" ||
    copper.shape !== "polygon"
  )
    throw new Error("Expected polygon copper and paste")
  const { CrossSection } = await getManifoldModule()
  const pasteSection = CrossSection.ofPolygons(
    [defaultPaste.points.map(({ x, y }) => [x, y])],
    "EvenOdd",
  )
  const copperSection = CrossSection.ofPolygons(
    [copper.points.map(({ x, y }) => [x, y])],
    "EvenOdd",
  )
  const outsideCopper = pasteSection.subtract(copperSection)
  try {
    expect(outsideCopper.area()).toBeCloseTo(0, 8)
  } finally {
    outsideCopper.delete()
    copperSection.delete()
    pasteSection.delete()
  }
  expect(expandedPaste.holes).toHaveLength(1)
  for (const aperture of apertures) pcb_solder_paste.parse(aperture)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
