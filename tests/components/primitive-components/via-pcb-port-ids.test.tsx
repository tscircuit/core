import { expect, test } from "bun:test"
import type { Port } from "lib/components/primitive-components/Port"
import { pcb_via } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual vias reference their own layer ports and aliases", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={8} routingDisabled>
      <net name="GND" />
      <via name="V1" pcbX={-2} pcbY={1} connectsTo="net.GND" />
      <via name="V2" pcbX={2} pcbY={1} connectsTo="net.GND" />
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={1} />
      <trace from=".R1 > .pin1" to=".V1 > .top" pcbStraightLine />
      <pcbnotetext
        pcbX={0}
        pcbY={-1}
        text="Each via owns top, bottom, pin1 ports"
        fontSize={0.35}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-2}
        text="R1 trace ends on a port listed by V1"
        fontSize={0.35}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const vias = circuit.db.pcb_via.list()
  expect(vias).toHaveLength(2)
  expect(vias).toMatchInlineSnapshot(`
    [
      {
        "from_layer": "bottom",
        "hole_diameter": 0.2,
        "layers": [
          "top",
          "bottom",
        ],
        "net_is_assignable": undefined,
        "outer_diameter": 0.3,
        "pcb_group_id": undefined,
        "pcb_port_ids": [
          "pcb_port_0",
          "pcb_port_1",
          "pcb_port_2",
        ],
        "pcb_via_id": "pcb_via_0",
        "source_net_id": "source_net_0",
        "subcircuit_connectivity_map_key": "unnamedsubcircuitsubcircuit_source_group_0_connectivity_net0",
        "subcircuit_id": "subcircuit_source_group_0",
        "to_layer": "top",
        "type": "pcb_via",
        "x": -2,
        "y": 1,
      },
      {
        "from_layer": "bottom",
        "hole_diameter": 0.2,
        "layers": [
          "top",
          "bottom",
        ],
        "net_is_assignable": undefined,
        "outer_diameter": 0.3,
        "pcb_group_id": undefined,
        "pcb_port_ids": [
          "pcb_port_3",
          "pcb_port_4",
          "pcb_port_5",
        ],
        "pcb_via_id": "pcb_via_1",
        "source_net_id": "source_net_0",
        "subcircuit_connectivity_map_key": "unnamedsubcircuitsubcircuit_source_group_0_connectivity_net0",
        "subcircuit_id": "subcircuit_source_group_0",
        "to_layer": "top",
        "type": "pcb_via",
        "x": 2,
        "y": 1,
      },
    ]
  `)
  const portGroups = vias.map((via) => {
    expect(via.pcb_port_ids).toHaveLength(3)
    expect(pcb_via.parse(via).pcb_port_ids).toEqual(via.pcb_port_ids)
    const ports = via.pcb_port_ids!.map((id) => circuit.db.pcb_port.get(id)!)
    const sourcePorts = ports.map(
      (port) => circuit.db.source_port.get(port.source_port_id)!,
    )
    expect(sourcePorts.map((port) => port.name).sort()).toEqual([
      "bottom",
      "pin1",
      "top",
    ])
    expect(
      new Set(sourcePorts.map((port) => port.source_component_id)).size,
    ).toBe(1)
    for (const port of ports) {
      expect({ x: port.x, y: port.y }).toEqual({ x: via.x, y: via.y })
    }
    return via.pcb_port_ids!
  })
  expect(new Set(portGroups.flat()).size).toBe(6)
  const topPort = circuit.selectOne(".V1 > .top") as Port
  expect(portGroups[0]).toContain(topPort.pcb_port_id!)
  const trace = circuit.db.pcb_trace.list()[0]
  expect(
    trace.route.some(
      (point) =>
        point.route_type === "wire" &&
        point.end_pcb_port_id === topPort.pcb_port_id,
    ),
  ).toBe(true)
  circuit.render()
  expect(circuit.db.pcb_via.list().map((via) => via.pcb_port_ids)).toEqual(
    portGroups,
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
