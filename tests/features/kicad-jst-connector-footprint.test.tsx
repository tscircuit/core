import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

const KICAD_FOOTPRINT_CACHE_URL = "https://kicad-mod-cache.tscircuit.com"

test(
  "kicad JST connector footprint loads correctly",
  async () => {
    const { circuit } = getTestFixture({
      platform: {
        footprintLibraryMap: {
          kicad: async (footprintName: string) => {
            const baseUrl = `${KICAD_FOOTPRINT_CACHE_URL}/${footprintName}`
            const circuitJsonUrl = `${baseUrl}.circuit.json`
            const res = await fetch(circuitJsonUrl)
            if (!res.ok) {
              throw new Error(
                `Failed to load KiCad footprint "${footprintName}" (HTTP ${res.status})`,
              )
            }
            const raw: any[] = await res.json()
            const filtered = raw.filter((el) =>
              el?.type === "pcb_silkscreen_text" ? el?.text === "REF**" : true,
            )
            return { footprintCircuitJson: filtered }
          },
        },
      },
    })

    circuit.add(
      <board routingDisabled>
        <chip
          name="U1"
          footprint="kicad:Connector_JST/JST_PH_B2B-PH-SM4-TB_1x02-1MP_P2.00mm_Vertical"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    const circuitJson = circuit.getCircuitJson()

    const errors = circuitJson.filter(
      (el) => el.type === "external_footprint_load_error",
    )

    expect(errors).toHaveLength(0)

    const ambiguousErrors = circuitJson.filter(
      (el) => el.type === "source_ambiguous_port_reference",
    )
    expect(ambiguousErrors).toHaveLength(1)
    expect((ambiguousErrors[0] as any).message).toContain(
      "U1.pin3 is ambiguous",
    )

    expect(convertCircuitJsonToPcbSvg(circuitJson as any)).toMatchSvgSnapshot(
      import.meta.path,
    )
  },
  30 * 1000,
)
