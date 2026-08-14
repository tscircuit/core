import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const capacitorRows = [0.46, 0.16, -0.14, -0.44] as const

const symbolPorts = [
  { pinNumber: 1, direction: "left", x: -0.7, y: 0.46 },
  { pinNumber: 2, direction: "left", x: -0.7, y: 0.16 },
  { pinNumber: 3, direction: "left", x: -0.7, y: -0.14 },
  { pinNumber: 4, direction: "left", x: -0.7, y: -0.44 },
  { pinNumber: 5, direction: "right", x: 0.7, y: -0.44 },
  { pinNumber: 6, direction: "right", x: 0.7, y: -0.14 },
  { pinNumber: 7, direction: "right", x: 0.7, y: 0.16 },
  { pinNumber: 8, direction: "right", x: 0.7, y: 0.46 },
] as const

const footprintPads = [
  {
    pinNumber: 1,
    pcbX: "-1.35001mm",
    pcbY: "-0.770001mm",
    width: "0.7500112mm",
  },
  {
    pinNumber: 8,
    pcbX: "-1.35001mm",
    pcbY: "0.770001mm",
    width: "0.7500112mm",
  },
  {
    pinNumber: 2,
    pcbX: "-0.40005mm",
    pcbY: "-0.770001mm",
    width: "0.580009mm",
  },
  {
    pinNumber: 7,
    pcbX: "-0.40005mm",
    pcbY: "0.770001mm",
    width: "0.580009mm",
  },
  {
    pinNumber: 3,
    pcbX: "0.40005mm",
    pcbY: "-0.770001mm",
    width: "0.580009mm",
  },
  {
    pinNumber: 6,
    pcbX: "0.40005mm",
    pcbY: "0.770001mm",
    width: "0.580009mm",
  },
  {
    pinNumber: 4,
    pcbX: "1.35001mm",
    pcbY: "-0.770001mm",
    width: "0.7500112mm",
  },
  {
    pinNumber: 5,
    pcbX: "1.35001mm",
    pcbY: "0.770001mm",
    width: "0.7500112mm",
  },
] as const

const C62857 = ({
  name,
  schX,
  pcbX,
}: {
  name: string
  schX: number
  pcbX: number
}) => (
  <capacitor
    name={name}
    capacitance="100nF"
    supplierPartNumbers={{ jlcpcb: ["C62857"] }}
    manufacturerPartNumber="6124B104K500NT"
    schX={schX}
    pcbX={pcbX}
    symbol={
      <symbol>
        {symbolPorts.map((port) => (
          <Fragment key={port.pinNumber}>
            <port
              name={`pin${port.pinNumber}`}
              pinNumber={port.pinNumber}
              aliases={[String(port.pinNumber)]}
              direction={port.direction}
              schX={port.x}
              schY={port.y}
              schStemLength={0.4}
            />
          </Fragment>
        ))}
        <schematicpath
          points={[
            { x: 0.3, y: -0.64 },
            { x: -0.3, y: -0.64 },
            { x: -0.3, y: 0.66 },
            { x: 0.3, y: 0.66 },
            { x: 0.3, y: -0.64 },
          ]}
          strokeColor="#880000"
        />
        <schematictext
          text={`${name} (C62857)`}
          schX={0}
          schY={0.9}
          fontSize={0.18}
          anchor="center"
          color="#008000"
        />
        {capacitorRows.map((y) => (
          <Fragment key={y}>
            <schematicpath
              points={[
                { x: -0.04, y: y + 0.1 },
                { x: -0.04, y: y - 0.1 },
              ]}
              strokeColor="#880000"
            />
            <schematicpath
              points={[
                { x: 0.02, y: y + 0.1 },
                { x: 0.02, y: y - 0.1 },
              ]}
              strokeColor="#880000"
            />
            <schematicpath
              points={[
                { x: -0.3, y },
                { x: -0.04, y },
              ]}
              strokeColor="#880000"
            />
            <schematicpath
              points={[
                { x: 0.02, y },
                { x: 0.3, y },
              ]}
              strokeColor="#880000"
            />
          </Fragment>
        ))}
      </symbol>
    }
    footprint={
      <footprint>
        {footprintPads.map((pad) => (
          <Fragment key={pad.pinNumber}>
            <smtpad
              portHints={[`pin${pad.pinNumber}`]}
              pcbX={pad.pcbX}
              pcbY={pad.pcbY}
              width={pad.width}
              height="0.7999984mm"
              shape="rect"
            />
          </Fragment>
        ))}
      </footprint>
    }
  />
)

test("two imported C62857 symbols connect through their explicit ports", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="8mm">
      <C62857 name="C1" schX={-1.5} pcbX={-2.5} />
      <C62857 name="C2" schX={1.5} pcbX={2.5} />
      <trace from=".C1 > .pin8" to=".C2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const c1 = circuit.db.source_component.getWhere({ name: "C1" })!
  const c2 = circuit.db.source_component.getWhere({ name: "C2" })!
  const c1Pin8 = circuit.db.source_port.getWhere({
    source_component_id: c1.source_component_id,
    name: "pin8",
  })!
  const c2Pin1 = circuit.db.source_port.getWhere({
    source_component_id: c2.source_component_id,
    name: "pin1",
  })!
  const sourceTrace = circuit.db.source_trace
    .list()
    .find(
      (trace) =>
        trace.connected_source_port_ids.includes(c1Pin8.source_port_id) &&
        trace.connected_source_port_ids.includes(c2Pin1.source_port_id),
    )

  expect(sourceTrace).toBeDefined()
  expect(circuit.db.source_port.list()).toHaveLength(16)
  expect(circuit.db.schematic_port.list()).toHaveLength(16)
  expect(circuit.db.schematic_trace.list()).toHaveLength(1)
  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    drawPorts: true,
    css: ".sch-port-label, .sch-pin-label { display: none; }",
  })
})
