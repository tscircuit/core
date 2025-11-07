import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"
import { getTestFootprintServer } from "tests/fixtures/get-test-footprint-server"

test("footprint library map 3", async () => {
  const { url: footprintServerUrl } = getTestFootprintServer(
    external0402Footprint,
  )
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async (footprintName: string) => {
          const url = `${footprintServerUrl}/${footprintName}.circuit.json`
          const res = await fetch(url)
          return { footprintCircuitJson: await res.json() }
        },
      },
    },
  })

  circuit.add(
    <board>
      <resistor
        name="R1"
        resistance="10k"
        footprint="kicad:Resistor_SMD.pretty/R_0402_1005Metric"
        pcbX={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  const pcb_board = circuitJson.filter((el) => el.type === "pcb_board")
  expect(pcb_board).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": 0,
          "y": 0,
        },
        "height": 4.64,
        "material": "fr4",
        "num_layers": 2,
        "outline": undefined,
        "pcb_board_id": "pcb_board_0",
        "shape": "rect",
        "thickness": 1.4,
        "type": "pcb_board",
        "width": 5.5600000000000005,
      },
    ]
  `)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
