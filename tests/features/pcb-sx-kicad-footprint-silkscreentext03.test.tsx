import { expect, test } from "bun:test"
import kicadModJson from "tests/fixtures/assets/R_0402_1005Metric.json" with {
  type: "json",
}
import { getTestFixture } from "../fixtures/get-test-fixture"

test("pcbSx kicad selector can customize silkscreen text position and font size together", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async () => {
          return { footprintCircuitJson: kicadModJson }
        },
      },
    },
  })

  circuit.add(
    <board
      width="30mm"
      height="20mm"
      pcbSx={{
        "& footprint[src^='kicad:'] silkscreentext": {
          pcbX: "0.8mm",
          pcbY: "-1.8mm",
          fontSize: "2mm",
        } as any,
      }}
    >
      <pcbnotetext
        pcbLeftEdgeX="calc(board.minX)"
        pcbTopEdgeY="calc(board.minY)"
        anchorAlignment="top_left"
        text="pcbSx: pcbX=0.8mm, pcbY=-1.8mm, fontSize=2mm"
        fontSize={0.7}
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint="kicad:R_0402_1005Metric"
        pcbX={4}
        pcbY={-1}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  const kicadText = silkscreenTexts.find((text) => text.text === "R1")

  expect(kicadText).toBeDefined()
  expect(kicadText?.font_size).toBe(2)
  expect(kicadText?.anchor_position.x).toBeCloseTo(4.8)
  expect(kicadText?.anchor_position.y).toBeCloseTo(-2.8)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
