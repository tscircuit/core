import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import kicadMod from "tests/fixtures/assets/R_0402_1005Metric.kicad_mod" with {
  type: "text",
}
import kicadModJson from "tests/fixtures/assets/R_0402_1005Metric.json" with {
  type: "json",
}

it("chip with cadassembly cadmodel react element", async () => {
  const { circuit, staticAssetsServerUrl } = getTestFixture({
    withStaticAssetsServer: true,
    platform: {
      footprintFileParserMap: {
        kicad_mod: {
          loadFromUrl: async (url: string) => {
            const content = atob(url.replace("data:text/plain;base64,", ""))
            expect(content).toBe(kicadMod)
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
      <chip
        footprint={`${staticAssetsServerUrl}/R_0402_1005Metric.kicad_mod`}
        name="U2"
      />
    </board>,
  )

  circuit.render()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
