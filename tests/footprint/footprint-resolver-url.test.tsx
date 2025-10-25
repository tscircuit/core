import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import kicadModJson from "tests/fixtures/assets/R_0402_1005Metric.json" with {
  type: "json",
}

it("prefers platform resolver for static footprint imports", async () => {
  const resolvedUrl = "https://cdn.example.com/footprint.kicad_mod"
  let resolverCalls = 0
  let loadCalls = 0

  const { circuit } = getTestFixture({
    platform: {
      projectBaseUrl: "http://localhost:3020/api/files/static",
      resolveProjectStaticFileImportUrl: async (path: string) => {
        resolverCalls += 1
        expect(path).toBe("/api/files/static/footprint.kicad_mod")
        return resolvedUrl
      },
      footprintFileParserMap: {
        kicad_mod: {
          loadFromUrl: async (url: string) => {
            loadCalls += 1
            expect(url).toBe(resolvedUrl)
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

  await circuit.renderUntilSettled()

  expect(resolverCalls).toBe(1)
  expect(loadCalls).toBe(1)
})
