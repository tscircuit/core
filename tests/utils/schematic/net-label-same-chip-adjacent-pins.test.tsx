import { expect, test } from "bun:test"
import { Circuit } from "lib/Circuit"

test("fallback net labels on two adjacent pins of the same chip stay anchored to their respective ports (#5545)", () => {
  const sixteenPins = Object.fromEntries(
    Array.from({ length: 16 }, (_, i) => [`pin${i + 1}`, `P${i + 1}`]),
  )

  const circuit = new Circuit()
  circuit.add(
    <board width="100mm" height="80mm">
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

  const circuitJson = circuit.getCircuitJson()
  const tieNet = circuitJson.find(
    (el) => el.type === "source_net" && el.name === "TIE",
  )
  expect(tieNet).toBeDefined()

  const u1Source = circuitJson.find(
    (el) => el.type === "source_component" && el.name === "U1",
  )
  expect(u1Source).toBeDefined()

  const u1SourcePorts = circuitJson.filter(
    (el) =>
      el.type === "source_port" &&
      el.source_component_id === u1Source!.source_component_id &&
      (el.pin_number === 1 || el.pin_number === 2),
  )
  expect(u1SourcePorts).toHaveLength(2)

  const u1SchematicPorts = u1SourcePorts.map((sp) =>
    circuitJson.find(
      (el) =>
        el.type === "schematic_port" &&
        el.source_port_id === sp.source_port_id,
    ),
  )
  expect(u1SchematicPorts[0]?.center).toBeDefined()
  expect(u1SchematicPorts[1]?.center).toBeDefined()

  const tieLabels = circuitJson.filter(
    (el) => el.type === "schematic_net_label" && el.text === "TIE",
  )

  if (tieLabels.length >= 2) {
    for (const schPort of u1SchematicPorts) {
      const hasMatchingAnchor = tieLabels.some((nl) => {
        if (!nl.anchor_position || !schPort?.center) return false
        const dx = nl.anchor_position.x - schPort.center.x
        const dy = nl.anchor_position.y - schPort.center.y
        return dx * dx + dy * dy < 0.01
      })
      expect(hasMatchingAnchor).toBe(true)
    }
  }
})
