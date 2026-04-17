import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

import { kicadLoader } from "tests/fixtures/kicadLoader"

test(
  "kicad JST connector footprint loads correctly",
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
    expect(ambiguousErrors).toHaveLength(0)

    const u1SourceComponent = circuit.db.source_component.getWhere({
      name: "U1",
    })
    const multiPcbPortSourcePorts = circuit.db.source_port
      .list({
        source_component_id: u1SourceComponent!.source_component_id,
      })
      .filter(
        (sourcePort) =>
          circuit.db.pcb_port
            .list()
            .filter(
              (pcbPort) => pcbPort.source_port_id === sourcePort.source_port_id,
            ).length > 1,
      )
      .map((sourcePort) => sourcePort.name)
    expect(multiPcbPortSourcePorts).toContain("pin3")

    expect(convertCircuitJsonToPcbSvg(circuitJson as any)).toMatchSvgSnapshot(
      import.meta.path,
    )
  },
  30 * 1000,
)
