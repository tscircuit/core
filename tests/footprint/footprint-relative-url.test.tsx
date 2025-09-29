import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import kicadModJson from "tests/fixtures/assets/R_0402_1005Metric.json" with {
  type: "json",
}

it("loads and renders footprint from relative URL accurately", async () => {
  const { circuit } = getTestFixture({
    platform: {
      projectBaseUrl: "http://localhost:3020/api/files/static",
      footprintFileParserMap: {
        kicad_mod: {
          loadFromUrl: async (url: string) => {
            return {
              footprintCircuitJson: kicadModJson,
            }
          },
        },
      },
    },
  })

  circuit.add(
    <board>
      <chip footprint="/api/files/static/footprint.kicad_mod" name="U2" />
    </board>,
  )

  circuit.render()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
