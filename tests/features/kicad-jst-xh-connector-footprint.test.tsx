import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

import jstXhB3BFootprint from "tests/fixtures/assets/external-jst-xh-b3b-footprint.json"

test(
  "kicad JST XH connector footprint loads correctly",
  async () => {
    const { circuit } = getTestFixture({
      platform: {
        footprintLibraryMap: {
          kicad: async (footprintName: string) => {
            if (
              footprintName ===
              "Connector_JST/JST_XH_B3B-XH-AM_1x03_P2.50mm_Vertical"
            ) {
              const filtered = jstXhB3BFootprint.filter((el) =>
                el?.type === "pcb_silkscreen_text"
                  ? el?.text === "REF**"
                  : true,
              )
              return { footprintCircuitJson: filtered }
            }
            throw new Error(
              `Footprint "${footprintName}" not found in local mock`,
            )
          },
        },
      },
    })

    circuit.add(
      <board routingDisabled>
        <chip
          name="U1"
          footprint="kicad:Connector_JST/JST_XH_B3B-XH-AM_1x03_P2.50mm_Vertical"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    const circuitJson = circuit.getCircuitJson()

    const errors = circuitJson.filter(
      (el) => el.type.includes("error") || el.type.includes("warning"),
    )

    expect(errors).toHaveLength(0)

    const holes = circuitJson.filter((el) => el.type === "pcb_plated_hole")
    expect(holes).toHaveLength(3)

    expect(convertCircuitJsonToPcbSvg(circuitJson as any)).toMatchSvgSnapshot(
      import.meta.path,
    )
  },
  30 * 1000,
)
