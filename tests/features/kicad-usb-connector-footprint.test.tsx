import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

import usb3AFootprint from "tests/fixtures/assets/external-usb3-a-footprint.json"

test(
  "kicad USB connector footprint loads correctly",
  async () => {
    const { circuit } = getTestFixture({
      platform: {
        footprintLibraryMap: {
          kicad: async (footprintName: string) => {
            if (footprintName === "Connector_USB/USB3_A_Molex_48393-001") {
              const filtered = usb3AFootprint.filter((el) =>
                el?.type === "pcb_silkscreen_text" ? el?.text === "REF**" : true,
              )
              return { footprintCircuitJson: filtered }
            }
            throw new Error(`Footprint "${footprintName}" not found in local mock`)
          },
        },
      },
    })

    circuit.add(
      <board routingDisabled>
        <chip
          name="U1"
          footprint="kicad:Connector_USB/USB3_A_Molex_48393-001"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    const circuitJson = circuit.getCircuitJson()

    const errors = circuitJson.filter(
      (el) => el.type === "external_footprint_load_error",
    )
    console.log("Footprint load errors:", JSON.stringify(errors, null, 2))

    const pcbComponents = circuitJson.filter(
      (el: any) => el.type === "pcb_component",
    )
    console.log("PCB components:", pcbComponents.length)

    const pcbSmtpads = circuitJson.filter((el: any) => el.type === "pcb_smtpad")
    console.log("PCB SMT pads:", pcbSmtpads.length)

    expect(errors).toHaveLength(0)

    const ambiguousErrors = circuitJson.filter(
      (el) => el.type === "source_ambiguous_port_reference",
    )
    expect(ambiguousErrors).toHaveLength(1)
    expect((ambiguousErrors[0] as any).message).toContain(
      "U1.pin10 is ambiguous",
    )

    expect(convertCircuitJsonToPcbSvg(circuitJson as any)).toMatchSvgSnapshot(
      import.meta.path,
    )
  },
  30 * 1000,
)
