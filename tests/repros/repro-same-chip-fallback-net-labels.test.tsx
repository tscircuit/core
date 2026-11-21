import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fallback schematic net labels for two adjacent pins of the same chip anchor at both ports (#5545)", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  const sixteenPins = Object.fromEntries(
    Array.from({ length: 16 }, (_, i) => [`pin${i + 1}`, `P${i + 1}`]),
  )

  circuit.add(
    <board width="100mm" height="80mm" routingDisabled>
      <chip
        name="U1"
        footprint="dip8"
        pinLabels={{
          pin1: "OUTA",
          pin2: "INA_N",
          pin3: "INA_P",
          pin4: "VEE",
          pin5: "INB_P",
          pin6: "INB_N",
          pin7: "OUTB",
          pin8: "VCC",
        }}
        connections={{
          pin1: "net.TIE",
          pin2: "net.TIE",
          pin3: "net.VREF",
          pin4: "net.GND",
          pin5: "net.LV",
          pin6: "net.FB",
          pin7: "net.FX",
          pin8: "net.VP",
        }}
      />
      <chip
        name="U2"
        footprint="dip16"
        pinLabels={sixteenPins}
        connections={{ pin15: "net.FB", pin7: "net.K1", pin8: "net.K2" }}
      />
      <chip
        name="U3"
        footprint="dip16"
        pinLabels={sixteenPins}
        connections={{ pin15: "net.FB", pin7: "net.K3", pin8: "net.K4" }}
      />
      <resistor
        name="R1"
        resistance="18k"
        footprint="axial_p10.16mm"
        connections={{ pin1: "net.K2", pin2: "net.MID" }}
      />
      <capacitor
        name="C1"
        capacitance="22uF"
        polarized
        footprint="axial_p10.16mm"
        connections={{ pin1: "net.MID", pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="1M"
        footprint="axial_p10.16mm"
        connections={{ pin1: "net.MID", pin2: "net.VREF" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const u1SourceComponent = circuit.db.source_component
    .list()
    .find((sourceComponent) => sourceComponent.name === "U1")!
  const u1TiePortCenters = circuit.db.source_port
    .list()
    .filter(
      (sourcePort) =>
        sourcePort.source_component_id ===
          u1SourceComponent.source_component_id &&
        (sourcePort.pin_number === 1 || sourcePort.pin_number === 2),
    )
    .map(
      (sourcePort) =>
        circuit.db.schematic_port.list({
          source_port_id: sourcePort.source_port_id,
        })[0]!.center,
    )
    .sort((left, right) => left.y - right.y)

  const tieNetLabels = circuit.db.schematic_net_label
    .list()
    .filter((netLabel) => netLabel.text === "TIE")
    .sort((left, right) => left.anchor_position!.y - right.anchor_position!.y)

  expect(tieNetLabels).toHaveLength(2)
  expect(tieNetLabels[0]!.anchor_position).toEqual(u1TiePortCenters[0]!)
  expect(tieNetLabels[1]!.anchor_position).toEqual(u1TiePortCenters[1]!)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
