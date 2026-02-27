import { expect, test } from "bun:test"
import kicadModJson from "tests/fixtures/assets/R_0402_1005Metric.json" with {
  type: "json",
}
import { getTestFixture } from "../fixtures/get-test-fixture"

test("pcbSx kicad selector can customize silkscreen text font size", async () => {
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
          fontSize: "2.5mm",
        },
      }}
    >
      <pcbnotetext
        pcbLeftEdgeX="calc(board.minX)"
        pcbTopEdgeY="calc(board.minY)"
        anchorAlignment="top_left"
        text="pcbSx: fontSize=2.5mm"
        fontSize={0.7}
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint="kicad:R_0402_1005Metric"
        pcbX={0}
        pcbY={0}
      />
      <silkscreentext text="LOCAL" pcbX={0} pcbY={4} fontSize="1mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  const kicadText = silkscreenTexts.find((text) => text.text === "R1")
  const localText = silkscreenTexts.find((text) => text.text === "LOCAL")

  expect(kicadText?.font_size).toBe(2.5)
  expect(localText?.font_size).toBe(1)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
