import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("polygon paste applies margins and omits covered or fully eroded pads", () => {
  const { circuit } = getTestFixture()
  const margins = [undefined, 0, -0.2, 0.2, -2]
  circuit.add(
    <board width={30} height={6}>
      {margins.map((margin, index) => (
        <smtpad
          shape="polygon"
          portHints={[`pin${index + 1}`]}
          solderPasteMargin={margin}
          points={[
            { x: index * 5 - 13, y: -1 },
            { x: index * 5 - 9, y: -1 },
            { x: index * 5 - 9, y: 1 },
            { x: index * 5 - 13, y: 1 },
          ]}
        />
      ))}
      <smtpad
        shape="polygon"
        portHints={["pin6"]}
        coveredWithSolderMask
        points={[
          { x: 12, y: -1 },
          { x: 14, y: -1 },
          { x: 14, y: 1 },
          { x: 12, y: 1 },
        ]}
      />
      <pcbnotetext
        text="Polygon paste: default / zero / negative / positive / erased / covered"
        pcbY={2.4}
        fontSize={0.35}
      />
    </board>,
  )
  circuit.render()
  const paste = circuit.db.pcb_solder_paste.list()
  expect(paste).toHaveLength(4)
  for (const [index, width] of [2.8, 4, 3.6, 4.4].entries()) {
    const aperture = paste[index]!
    if (aperture.shape !== "polygon") throw new Error("Expected polygon paste")
    expect(
      Math.max(...aperture.points.map((p) => p.x)) -
        Math.min(...aperture.points.map((p) => p.x)),
    ).toBeCloseTo(width)
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
