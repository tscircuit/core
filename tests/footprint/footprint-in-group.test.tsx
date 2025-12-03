import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import kicadModJson from "tests/fixtures/assets/R_0402_1005Metric.json" with {
  type: "json",
}

it("chip with footprint inside group should load footprint", async () => {
  const resolvedUrl = "https://cdn.example.com/footprint.kicad_mod"
  let loadCalls = 0

  const { circuit } = getTestFixture({
    platform: {
      projectBaseUrl: "http://localhost:3020/api/files/static",
      resolveProjectStaticFileImportUrl: async (path: string) => {
        return resolvedUrl
      },
      footprintFileParserMap: {
        kicad_mod: {
          loadFromUrl: async (url: string) => {
            loadCalls += 1
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
      <group name="MCU">
        <chip footprint="/api/files/static/footprint.kicad_mod" name="U2" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(loadCalls).toBe(1)

  const smtpads = circuit.selectAll("smtpad")
  expect(smtpads.length).toBeGreaterThan(0)
})
