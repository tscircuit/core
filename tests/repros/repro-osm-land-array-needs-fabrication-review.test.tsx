import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "a 0.5 mm OSM-style land array warns that generic DRC is not fabrication qualification",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="20mm" height="20mm" routingDisabled>
        <chip
          name="U1"
          manufacturerPartNumber="OSM-S-AM62L"
          footprint="bga100_grid10x10_p0.5mm_pad0.25mm_circularpads"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit.db.pcb_pad_pad_clearance_error.list()).toEqual([])

    const fabricationProcessWarnings = circuit
      .getCircuitJson()
      .filter((element) =>
        element.type.includes("pcb_fabrication_process_warning"),
      )

    expect(fabricationProcessWarnings).toHaveLength(1)
  },
)
