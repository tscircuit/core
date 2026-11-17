import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("same-chip adjacent pins connected to the same net each receive a schematic net label (#5545)", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "A1",
          pin2: "A2",
          pin3: "B1",
          pin4: "B2",
          pin5: "C1",
          pin6: "C2",
          pin7: "GND",
          pin8: "VCC",
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["pin1", "pin2", "pin3", "pin4"],
          },
          rightSide: {
            direction: "bottom-to-top",
            pins: ["pin5", "pin6", "pin7", "pin8"],
          },
        }}
        connections={{
          pin1: "net.NET1",
          pin2: "net.NET1",
          pin3: "net.NET2",
          pin4: "net.NET2",
          pin5: "net.NET3",
          pin6: "net.NET3",
          pin7: "net.GND",
          pin8: "net.VCC",
        }}
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        schX={6}
        schY={2}
        connections={{
          pin1: "net.NET1",
          pin2: "net.GND",
        }}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        schX={6}
        schY={-2}
        connections={{
          pin1: "net.NET2",
          pin2: "net.GND",
        }}
      />
    </board>,
  )

  circuit.render()

  const netLabels = circuit.db.schematic_net_label.list()
  const schPorts = circuit.db.schematic_port.list()
  const sourcePorts = circuit.db.source_port.list()
  const schComponents = circuit.db.schematic_component.list()

  const u1SchComp = schComponents.find(
    (c) =>
      schPorts.filter(
        (p) => p.schematic_component_id === c.schematic_component_id,
      ).length === 8,
  )
  expect(u1SchComp).toBeDefined()

  const getU1Port = (pinNumber: number) => {
    const sp = sourcePorts.find(
      (p) =>
        p.pin_number === pinNumber &&
        schPorts.some(
          (schPort) =>
            schPort.source_port_id === p.source_port_id &&
            schPort.schematic_component_id === u1SchComp!.schematic_component_id,
        ),
    )
    expect(sp).toBeDefined()
    const schPort = schPorts.find(
      (p) => p.source_port_id === sp!.source_port_id,
    )
    expect(schPort).toBeDefined()
    return schPort!
  }

  for (const [pinNumber, expectedText] of [
    [1, "NET1"],
    [2, "NET1"],
    [3, "NET2"],
    [4, "NET2"],
    [5, "NET3"],
    [6, "NET3"],
  ] as const) {
    const port = getU1Port(pinNumber)
    const matchingLabel = netLabels.find((nl) => {
      if (nl.text !== expectedText || !nl.anchor_position) return false
      const dx = nl.anchor_position.x - port.center.x
      const dy = nl.anchor_position.y - port.center.y
      return Math.hypot(dx, dy) < 0.1
    })
    expect(matchingLabel).toBeDefined()
  }
})
