import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import kicadModJson from "tests/fixtures/assets/R_0402_1005Metric.json" with {
  type: "json",
}

it("should correctly load and render a KiCad footprint from a blob: URL", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintFileParserMap: {
        kicad_mod: {
          loadFromUrl: async (url: string) => {
            expect(url.startsWith("blob:")).toBe(true)
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
      <chip footprint="blob:null/12345678-1234-1234-1234-123456789012#ext=kicad_mod" name="U1" />
    </board>,
  )

  circuit.render()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
