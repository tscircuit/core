import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a 0.5 mm OSM-style land array warns that generic DRC is not fabrication qualification", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="32mm" height="20mm" routingDisabled>
      <chip
        name="U1"
        manufacturerPartNumber="OSM-S-AM62L"
        footprint="bga100_grid10x10_p0.5mm_pad0.25mm_circularpads"
      />
      <chip
        name="U2"
        pcbX={9}
        footprint="bga36_grid6x6_p0.8mm_pad0.35mm_circularpads"
      />
      <chip
        name="U3"
        pcbX={-9}
        footprint="qfn56_w7.8_h7.8_p0.4mm_pw0.23mm_pl0.8mm_thermalpad3.2x3.2"
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
  expect(fabricationProcessWarnings[0]).toMatchObject({
    land_pitch: 0.5,
    required_process: "laser_microvia_or_via_in_pad",
    manufacturer: "jlcpcb",
  })
})
