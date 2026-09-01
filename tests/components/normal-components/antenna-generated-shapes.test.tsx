import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("antennaShape generates common 2.4 GHz PCB antenna geometries", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="125mm" height="58mm">
      <antenna
        name="ANT1"
        antennaShape="2.4ghz_quarter_wave_monopole"
        pcbX={-55}
        pcbY={15}
      />
      <pcbnotetext
        text="2.4 GHz quarter-wave monopole"
        pcbX={-39}
        pcbY={11}
        fontSize="0.8mm"
      />

      <antenna
        name="ANT2"
        antennaShape="2.4ghz_meandered_monopole"
        frequencyBand="5ghz"
        pcbX={-15}
        pcbY={14}
      />
      <pcbnotetext
        text="2.4 GHz meandered monopole"
        pcbX={-7.5}
        pcbY={11}
        fontSize="0.8mm"
      />

      <antenna
        name="ANT3"
        antennaShape="2.4ghz_inverted_f"
        pcbX={22}
        pcbY={12}
      />
      <pcbnotetext
        text="2.4 GHz inverted-F (feed + ground)"
        pcbX={31}
        pcbY={9}
        fontSize="0.8mm"
      />

      <antenna
        name="ANT4"
        antennaShape="2.4ghz_meandered_inverted_f"
        pcbX={-48}
        pcbY={-18}
      />
      <pcbnotetext
        text="2.4 GHz meandered inverted-F"
        pcbX={-41}
        pcbY={-22}
        fontSize="0.8mm"
      />

      <antenna
        name="ANT5"
        antennaShape="2.4ghz_folded_dipole"
        pcbX={10}
        pcbY={-20}
      />
      <pcbnotetext
        text="2.4 GHz folded dipole (feed + feed2)"
        pcbX={10.5}
        pcbY={-24}
        fontSize="0.8mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace.list()).toHaveLength(5)
  expect(circuit.db.pcb_keepout.list()).toHaveLength(15)
  expect(circuit.db.pcb_via.list()).toHaveLength(0)
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(2)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(6)
  expect(circuit.db.source_port.list()).toHaveLength(8)
  expect(circuit.db.pcb_missing_footprint_error.list()).toHaveLength(0)

  const foldedDipoleSourceComponent = circuit.db.source_component.getWhere({
    name: "ANT5",
  })!
  const foldedDipoleFeed1 = circuit.db.source_port.getWhere({
    source_component_id: foldedDipoleSourceComponent.source_component_id,
    pin_number: 1,
  })!
  const foldedDipoleFeed2 = circuit.db.source_port.getWhere({
    source_component_id: foldedDipoleSourceComponent.source_component_id,
    pin_number: 2,
  })!
  expect(foldedDipoleFeed1.port_hints).toContain("feed")
  expect(foldedDipoleFeed1.port_hints).toContain("feed1")
  expect(foldedDipoleFeed2.port_hints).toContain("feed2")

  const quarterWaveSourceComponent = circuit.db.source_component.getWhere({
    name: "ANT1",
  })!
  const quarterWavePcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: quarterWaveSourceComponent.source_component_id,
  })!
  expect(quarterWavePcbComponent.width).toBeCloseTo(33.6)
  expect(quarterWavePcbComponent.center.x).toBeCloseTo(-39.5)

  const quarterWaveKeepouts = circuit.db.pcb_keepout
    .list()
    .filter((keepout) =>
      keepout.excluded_pcb_component_ids?.includes(
        quarterWavePcbComponent.pcb_component_id,
      ),
    )
  expect(quarterWaveKeepouts).toHaveLength(3)
  expect(quarterWaveKeepouts).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        shape: "rect",
        layers: ["top", "bottom"],
      }),
    ]),
  )

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
