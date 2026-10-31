import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"

const dualOpAmpPins = {
  pin1: ["OUT1"],
  pin2: ["IN1_NEG"],
  pin3: ["IN1_POS"],
  pin4: ["VEE"],
  pin5: ["IN2_POS"],
  pin6: ["IN2_NEG"],
  pin7: ["OUT2"],
  pin8: ["VCC"],
}

test("stem-anchored netlabels connect all shared schematicsymbol supply projections", async () => {
  const circuit = new RootCircuit()

  circuit.add(
    <board routingDisabled>
      <net name="V5" isPowerNet />
      <net name="GND" isGroundNet />

      <chip name="U3" noSchematicRepresentation pinLabels={dualOpAmpPins} />

      <schematicsymbol
        name="U3A"
        chipRef=".U3"
        symbolName="opamp_with_power_right"
        connections={{
          inp1: "U3.pin3",
          inp2: "U3.pin2",
          out: "U3.pin1",
          "V+": "U3.pin8",
          "V-": "U3.pin4",
        }}
        schX={0}
        schY={0}
      />
      <schematicsymbol
        name="U3B"
        chipRef=".U3"
        symbolName="opamp_with_power_right"
        connections={{
          inp1: "U3.pin5",
          inp2: "U3.pin6",
          out: "U3.pin7",
          "V+": "U3.pin8",
          "V-": "U3.pin4",
        }}
        schX={5}
        schY={0}
      />

      <netlabel
        net="V5"
        connection="U3A.pin5"
        anchorSide="bottom"
        schX={-0.03}
        schY={0.39}
      />
      <netlabel
        net="GND"
        connection="U3A.pin3"
        anchorSide="top"
        schX={-0.02}
        schY={-0.39}
      />
      <netlabel
        net="V5"
        connection="U3B.pin5"
        anchorSide="bottom"
        schX={4.97}
        schY={0.39}
      />
      <netlabel
        net="GND"
        connection="U3B.pin3"
        anchorSide="top"
        schX={4.98}
        schY={-0.39}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const supplyPorts = circuit.db.schematic_port
    .list()
    .filter((port) => port.pin_number === 3 || port.pin_number === 5)

  expect(supplyPorts).toHaveLength(4)
  for (const port of supplyPorts) {
    expect(port.is_connected).toBe(true)
  }

  const netLabels = circuit.db.schematic_net_label.list()
  expect(netLabels.map((label) => label.text).sort()).toEqual([
    "GND",
    "GND",
    "V5",
    "V5",
  ])
})

test("offset netlabels route schematic traces to both shared schematicsymbol supply projections", async () => {
  const circuit = new RootCircuit()

  circuit.add(
    <board routingDisabled>
      <net name="V5" isPowerNet />
      <net name="GND" isGroundNet />

      <chip name="U3" noSchematicRepresentation pinLabels={dualOpAmpPins} />

      <schematicsymbol
        name="U3A"
        chipRef=".U3"
        symbolName="opamp_with_power_right"
        connections={{
          inp1: "U3.pin3",
          inp2: "U3.pin2",
          out: "U3.pin1",
          "V+": "U3.pin8",
          "V-": "U3.pin4",
        }}
        schX={0}
        schY={0}
      />
      <schematicsymbol
        name="U3B"
        chipRef=".U3"
        symbolName="opamp_with_power_right"
        connections={{
          inp1: "U3.pin5",
          inp2: "U3.pin6",
          out: "U3.pin7",
          "V+": "U3.pin8",
          "V-": "U3.pin4",
        }}
        schX={5}
        schY={0}
      />

      <netlabel
        net="V5"
        connection="U3A.pin5"
        anchorSide="bottom"
        schX={-0.03}
        schY={0.7}
      />
      <netlabel
        net="GND"
        connection="U3A.pin3"
        anchorSide="top"
        schX={-0.02}
        schY={-0.7}
      />
      <netlabel
        net="V5"
        connection="U3B.pin5"
        anchorSide="bottom"
        schX={4.97}
        schY={0.7}
      />
      <netlabel
        net="GND"
        connection="U3B.pin3"
        anchorSide="top"
        schX={4.98}
        schY={-0.7}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const supplyPorts = circuit.db.schematic_port
    .list()
    .filter((port) => port.pin_number === 3 || port.pin_number === 5)

  expect(supplyPorts).toHaveLength(4)
  for (const port of supplyPorts) {
    expect(port.is_connected).toBe(true)
  }

  const traces = circuit.db.schematic_trace.list()
  expect(traces).toHaveLength(4)
})

test("coordinate-free netlabels attach to shared schematicsymbol supply projections without throwing", async () => {
  const circuit = new RootCircuit()

  circuit.add(
    <board routingDisabled>
      <net name="V5" isPowerNet />
      <net name="GND" isGroundNet />

      <chip name="U3" noSchematicRepresentation pinLabels={dualOpAmpPins} />

      <schematicsymbol
        name="U3A"
        chipRef=".U3"
        symbolName="opamp_with_power_right"
        connections={{
          inp1: "U3.pin3",
          inp2: "U3.pin2",
          out: "U3.pin1",
          "V+": "U3.pin8",
          "V-": "U3.pin4",
        }}
        schX={0}
        schY={0}
      />
      <schematicsymbol
        name="U3B"
        chipRef=".U3"
        symbolName="opamp_with_power_right"
        connections={{
          inp1: "U3.pin5",
          inp2: "U3.pin6",
          out: "U3.pin7",
          "V+": "U3.pin8",
          "V-": "U3.pin4",
        }}
        schX={5}
        schY={0}
      />

      <netlabel net="V5" connection="U3A.pin5" anchorSide="bottom" />
      <netlabel net="GND" connection="U3A.pin3" anchorSide="top" />
      <netlabel net="V5" connection="U3B.pin5" anchorSide="bottom" />
      <netlabel net="GND" connection="U3B.pin3" anchorSide="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const supplyPorts = circuit.db.schematic_port
    .list()
    .filter((port) => port.pin_number === 3 || port.pin_number === 5)

  expect(supplyPorts).toHaveLength(4)
  for (const port of supplyPorts) {
    expect(port.is_connected).toBe(true)
  }

  const netLabels = circuit.db.schematic_net_label.list()
  expect(netLabels.map((label) => label.text).sort()).toEqual([
    "GND",
    "GND",
    "V5",
    "V5",
  ])
})

test("composite subcircuit with exposedNets does not emit fallback labels over explicit shared supply netlabels", async () => {
  const circuit = new RootCircuit()

  circuit.add(
    <board routingDisabled>
      <net name="V5" isPowerNet />
      <net name="GND" isGroundNet />

      <subcircuit name="Stage" exposedNets={["V5", "GND"]}>
        <net name="V5" isPowerNet />
        <net name="GND" isGroundNet />

        <chip name="U3" noSchematicRepresentation pinLabels={dualOpAmpPins} />

        <schematicsymbol
          name="U3A"
          chipRef=".U3"
          symbolName="opamp_with_power_right"
          connections={{
            inp1: "U3.pin3",
            inp2: "U3.pin2",
            out: "U3.pin1",
            "V+": "U3.pin8",
            "V-": "U3.pin4",
          }}
          schX={0}
          schY={0}
        />
        <schematicsymbol
          name="U3B"
          chipRef=".U3"
          symbolName="opamp_with_power_right"
          connections={{
            inp1: "U3.pin5",
            inp2: "U3.pin6",
            out: "U3.pin7",
            "V+": "U3.pin8",
            "V-": "U3.pin4",
          }}
          schX={5}
          schY={0}
        />

        <netlabel
          net="V5"
          connection="U3A.pin5"
          anchorSide="bottom"
          schX={-0.03}
          schY={0.39}
        />
        <netlabel
          net="GND"
          connection="U3A.pin3"
          anchorSide="top"
          schX={-0.02}
          schY={-0.39}
        />
        <netlabel
          net="V5"
          connection="U3B.pin5"
          anchorSide="bottom"
          schX={4.97}
          schY={0.39}
        />
        <netlabel
          net="GND"
          connection="U3B.pin3"
          anchorSide="top"
          schX={4.98}
          schY={-0.39}
        />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  const supplyPorts = circuit.db.schematic_port
    .list()
    .filter((port) => port.pin_number === 3 || port.pin_number === 5)

  expect(supplyPorts).toHaveLength(4)
  for (const port of supplyPorts) {
    expect(port.is_connected).toBe(true)
  }

  const netLabels = circuit.db.schematic_net_label.list()
  expect(netLabels.map((label) => label.text).sort()).toEqual([
    "GND",
    "GND",
    "V5",
    "V5",
  ])
})
