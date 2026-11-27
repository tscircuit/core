import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom symbols on connectors and built-in-symbol components omit unplaced PCB pins from schematic", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="12mm" routingDisabled>
      <connector
        name="J1"
        schX={-3}
        pinCount={4}
        footprint="pinrow4"
        pinLabels={{
          pin1: "VCC",
          pin2: "GND",
          pin3: "NC1",
          pin4: "NC2",
        }}
        noConnect={["NC1", "NC2"]}
        symbol={
          <symbol>
            <schematicrect width={0.6} height={0.8} strokeWidth={0.03} />
            <port
              name="VCC"
              pinNumber={1}
              direction="left"
              schX={-0.5}
              schY={0.2}
            />
            <port
              name="GND"
              pinNumber={2}
              direction="left"
              schX={-0.5}
              schY={-0.2}
            />
          </symbol>
        }
      />
      <switch
        name="SW1"
        schX={3}
        type="spst"
        footprint="sot23"
        pinLabels={{ pin1: "A", pin2: "B", pin3: "NC" }}
        pinAttributes={{ pin3: { doNotConnect: true } }}
        symbol={
          <symbol>
            <schematicrect width={0.6} height={0.4} strokeWidth={0.03} />
            <port
              name="A"
              pinNumber={1}
              direction="left"
              schX={-0.5}
              schY={0}
            />
            <port
              name="B"
              pinNumber={2}
              direction="right"
              schX={0.5}
              schY={0}
            />
          </symbol>
        }
        connections={{ A: "net.IN", B: "net.OUT" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const j1 = circuit.db.source_component.getWhere({ name: "J1" })!
  const j1SourcePorts = circuit.db.source_port
    .list()
    .filter((p) => p.source_component_id === j1.source_component_id)
  expect(j1SourcePorts.map((p) => p.pin_number).sort()).toEqual([1, 2, 3, 4])
  expect(j1SourcePorts.find((p) => p.pin_number === 3)?.do_not_connect).toBe(
    true,
  )
  expect(j1SourcePorts.find((p) => p.pin_number === 4)?.do_not_connect).toBe(
    true,
  )

  const j1PcbComp = circuit.db.pcb_component.getWhere({
    source_component_id: j1.source_component_id,
  })!
  expect(
    circuit.db.pcb_port
      .list()
      .filter((p) => p.pcb_component_id === j1PcbComp.pcb_component_id),
  ).toHaveLength(4)

  const j1SchComp = circuit.db.schematic_component.getWhere({
    source_component_id: j1.source_component_id,
  })!
  expect(
    circuit.db.schematic_port
      .list()
      .filter(
        (p) => p.schematic_component_id === j1SchComp.schematic_component_id,
      )
      .map((p) => p.pin_number)
      .sort(),
  ).toEqual([1, 2])

  const sw1 = circuit.db.source_component.getWhere({ name: "SW1" })!
  const sw1SourcePorts = circuit.db.source_port
    .list()
    .filter((p) => p.source_component_id === sw1.source_component_id)
  expect(sw1SourcePorts.map((p) => p.pin_number).sort()).toEqual([1, 2, 3])
  expect(sw1SourcePorts.find((p) => p.pin_number === 3)?.do_not_connect).toBe(
    true,
  )

  const sw1PcbComp = circuit.db.pcb_component.getWhere({
    source_component_id: sw1.source_component_id,
  })!
  expect(
    circuit.db.pcb_port
      .list()
      .filter((p) => p.pcb_component_id === sw1PcbComp.pcb_component_id),
  ).toHaveLength(3)

  const sw1SchComp = circuit.db.schematic_component.getWhere({
    source_component_id: sw1.source_component_id,
  })!
  expect(
    circuit.db.schematic_port
      .list()
      .filter(
        (p) => p.schematic_component_id === sw1SchComp.schematic_component_id,
      )
      .map((p) => p.pin_number)
      .sort(),
  ).toEqual([1, 2])
})
