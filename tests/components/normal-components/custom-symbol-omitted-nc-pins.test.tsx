import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom symbol omits unplaced NC pins from schematic_port while preserving source and PCB ports", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="BZ1"
        footprint="sot23"
        pinLabels={{ pin1: "POS", pin2: "NEG", pin3: "NC" }}
        pinAttributes={{ pin3: { doNotConnect: true } }}
        symbol={
          <symbol>
            <schematicrect width={0.4} height={0.4} strokeWidth={0.03} />
            <port
              name="POS"
              pinNumber={1}
              direction="left"
              schX={-0.4}
              schY={0.1}
            />
            <port
              name="NEG"
              pinNumber={2}
              direction="left"
              schX={-0.4}
              schY={-0.1}
            />
          </symbol>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourcePorts = circuit.db.source_port.list()
  expect(sourcePorts).toHaveLength(3)

  const ncSourcePort = sourcePorts.find((p) => p.name === "NC")
  expect(ncSourcePort).toBeDefined()
  expect(ncSourcePort?.pin_number).toBe(3)
  expect(ncSourcePort?.do_not_connect).toBe(true)

  const pcbPorts = circuit.db.pcb_port.list()
  expect(pcbPorts).toHaveLength(3)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(3)
  expect(
    pcbPorts.find((p) => p.source_port_id === ncSourcePort?.source_port_id),
  ).toBeDefined()

  const schematicPorts = circuit.db.schematic_port.list()
  expect(schematicPorts).toHaveLength(2)
  expect(
    schematicPorts.map((p) => p.pin_number).sort((a, b) => a! - b!),
  ).toEqual([1, 2])
  expect(
    schematicPorts.find(
      (p) => p.source_port_id === ncSourcePort?.source_port_id,
    ),
  ).toBeUndefined()
})

test("custom symbol preserves schematic_port when NC pin is explicitly placed in symbol", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="BZ1"
        footprint="sot23"
        pinLabels={{ pin1: "POS", pin2: "NEG", pin3: "NC" }}
        pinAttributes={{ pin3: { doNotConnect: true } }}
        symbol={
          <symbol>
            <schematicrect width={0.4} height={0.4} strokeWidth={0.03} />
            <port
              name="POS"
              pinNumber={1}
              direction="left"
              schX={-0.4}
              schY={0.1}
            />
            <port
              name="NEG"
              pinNumber={2}
              direction="left"
              schX={-0.4}
              schY={-0.1}
            />
            <port
              name="NC"
              pinNumber={3}
              direction="right"
              schX={0.4}
              schY={0}
            />
          </symbol>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourcePorts = circuit.db.source_port.list()
  const ncSourcePort = sourcePorts.find((p) => p.name === "NC")!
  expect(ncSourcePort.do_not_connect).toBe(true)

  const schematicPorts = circuit.db.schematic_port.list()
  expect(schematicPorts).toHaveLength(3)

  const ncSchematicPort = schematicPorts.find(
    (p) => p.source_port_id === ncSourcePort.source_port_id,
  )
  expect(ncSchematicPort).toBeDefined()
  expect(ncSchematicPort?.center.x).toBeCloseTo(0.4)
  expect(ncSchematicPort?.center.y).toBeCloseTo(0)
  expect(ncSchematicPort?.facing_direction).toBe("right")
})

test("custom symbol maps omitted internallyConnectedPins to explicit symbol port without phantom box port", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        footprint="sot23"
        pinLabels={{ pin1: "IN1", pin2: "IN2", pin3: "OUT" }}
        internallyConnectedPins={[["pin1", "pin2"]]}
        symbol={
          <symbol>
            <schematicrect width={0.4} height={0.4} strokeWidth={0.03} />
            <port
              name="IN1"
              pinNumber={1}
              direction="left"
              schX={-0.4}
              schY={0}
              schStemLength={0.2}
            />
            <port
              name="OUT"
              pinNumber={3}
              direction="right"
              schX={0.4}
              schY={0}
              schStemLength={0.2}
            />
          </symbol>
        }
        connections={{ IN2: ".R1 > .pin1", OUT: "net.LOAD" }}
      />
      <resistor name="R1" resistance="1k" footprint="0402" schX={-3} schY={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const u1 = circuit.db.source_component.getWhere({ name: "U1" })!
  const sourcePorts = circuit.db.source_port.list({
    source_component_id: u1.source_component_id,
  })
  expect(sourcePorts).toHaveLength(3)

  const in1SourcePort = sourcePorts.find((p) => p.name === "IN1")!
  const in2SourcePort = sourcePorts.find((p) => p.name === "IN2")!
  const outSourcePort = sourcePorts.find((p) => p.name === "OUT")!

  const schematicPorts = circuit.db.schematic_port.list()
  const in1SchPort = schematicPorts.find(
    (p) => p.source_port_id === in1SourcePort.source_port_id,
  )
  const in2SchPort = schematicPorts.find(
    (p) => p.source_port_id === in2SourcePort.source_port_id,
  )
  const outSchPort = schematicPorts.find(
    (p) => p.source_port_id === outSourcePort.source_port_id,
  )

  expect(in1SchPort).toBeDefined()
  expect(in2SchPort).toBeDefined()
  expect(outSchPort).toBeDefined()

  // U1 has 3 schematic_ports (IN1, IN2 mapped to IN1, OUT) + R1 has 2 = 5 total (no phantom box port)
  expect(schematicPorts).toHaveLength(5)
  expect(in2SchPort!.center).toEqual(in1SchPort!.center)
  expect(in2SchPort!.facing_direction).toBe("left")
  expect(in2SchPort!.is_connected).toBe(true)

  const tracesAtIn1 = circuit.db.schematic_trace
    .list()
    .filter((trace) =>
      trace.edges.some(
        (edge) =>
          Math.hypot(
            edge.from.x - in1SchPort!.center.x,
            edge.from.y - in1SchPort!.center.y,
          ) < 1e-4 ||
          Math.hypot(
            edge.to.x - in1SchPort!.center.x,
            edge.to.y - in1SchPort!.center.y,
          ) < 1e-4,
      ),
    )
  expect(tracesAtIn1.length).toBeGreaterThan(0)
})
