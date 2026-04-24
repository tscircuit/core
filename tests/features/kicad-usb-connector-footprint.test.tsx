import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

import { kicadLoader } from "tests/fixtures/kicadLoader"

test(
  "kicad USB connector footprint loads correctly",
  async () => {
    const { circuit } = getTestFixture({
      platform: {
        footprintLibraryMap: {
          kicad: kicadLoader,
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

    expect(errors).toHaveLength(0)

    const ambiguousErrors = circuitJson.filter(
      (el) => el.type === "source_ambiguous_port_reference",
    )
    expect(ambiguousErrors).toHaveLength(0)

    expect(convertCircuitJsonToPcbSvg(circuitJson as any)).toMatchSvgSnapshot(
      import.meta.path,
    )
  },
  30 * 1000,
)
