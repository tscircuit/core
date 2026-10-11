import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ViaInner2PortsBoard } from "tests/fixtures/via-layer-ports-board"

test.failing(
  "through vias expose ports and connect traces on inner2",
  async () => {
    const { circuit } = getTestFixture()
    circuit.schematicDisabled = true
    circuit.add(<ViaInner2PortsBoard />)
    await circuit.renderUntilSettled()

    const vias = circuit.db.pcb_via.list()
    expect(vias).toHaveLength(2)

    const firstViaPorts = vias[0]!.pcb_port_ids!.map((pcbPortId) =>
      circuit.db.pcb_port.get(pcbPortId),
    )
    expect(firstViaPorts.map((pcbPort) => pcbPort!.layers)).toEqual([
      ["top"],
      ["inner1"],
      ["inner2"],
      ["bottom"],
    ])

    const secondViaPorts = vias[1]!.pcb_port_ids!.map((pcbPortId) =>
      circuit.db.pcb_port.get(pcbPortId),
    )
    expect(secondViaPorts.map((pcbPort) => pcbPort!.layers)).toEqual([
      ["top"],
      ["inner1"],
      ["inner2"],
      ["bottom"],
    ])

    expect(circuit.db.source_trace_not_connected_error.list()).toEqual([])
    const traces = circuit.db.pcb_trace.list()
    expect(traces).toHaveLength(1)
    expect([traces[0]!.route[0], traces[0]!.route.at(-1)]).toMatchObject([
      {
        route_type: "wire",
        x: -2,
        y: 0,
        width: 0.2,
        layer: "inner2",
      },
      {
        route_type: "wire",
        x: 2,
        y: 0,
        width: 0.2,
        layer: "inner2",
      },
    ])
  },
)
