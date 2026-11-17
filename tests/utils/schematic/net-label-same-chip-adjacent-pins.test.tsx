import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("same-chip adjacent pins connected to the same net each receive a schematic net label (#5545)", () => {
  const { circuit } = getTestFixture()

  const sixteenPins = Object.fromEntries(
    Array.from({ length: 16 }, (_, i) => [`pin${i + 1}`, `P${i + 1}`]),
  )

  circuit.add(
    <board width="100mm" height="80mm">
      {/* U1 pin1 and pin2 share net.TIE and nothing else is on that net */}
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

  circuit.render()

  const netLabels = circuit.db.schematic_net_label
    .list()
    .filter((nl) => nl.text === "TIE")
  expect(netLabels).toHaveLength(2)

  const u1SourceComp = circuit.db.source_component
    .list()
    .find((c) => c.name === "U1")
  expect(u1SourceComp).toBeDefined()

  const u1SourcePorts = circuit.db.source_port
    .list()
    .filter(
      (p) =>
        p.source_component_id === u1SourceComp!.source_component_id &&
        (p.pin_number === 1 || p.pin_number === 2),
    )
  expect(u1SourcePorts).toHaveLength(2)

  for (const sp of u1SourcePorts) {
    const schPort = circuit.db.schematic_port
      .list()
      .find((p) => p.source_port_id === sp.source_port_id)
    expect(schPort).toBeDefined()

    const matchingLabel = netLabels.find((nl) => {
      if (!nl.anchor_position) return false
      const dx = nl.anchor_position.x - schPort!.center.x
      const dy = nl.anchor_position.y - schPort!.center.y
      return Math.hypot(dx, dy) < 0.05
    })
    expect(matchingLabel).toBeDefined()
  }
})
