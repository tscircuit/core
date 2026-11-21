import { expect } from "bun:test"
import { PcbConnectivityMap } from "circuit-json-to-connectivity-map"
import type { RootCircuit } from "lib/RootCircuit"
import type { Port } from "lib/components/primitive-components/Port"
import { keystone3002Connections } from "./keystone-3002-board"

export function expectKeystone3002Routing(circuit: RootCircuit) {
  const holder = circuit.db.source_component.getWhere({ name: "BT1" })!
  const holderPcb = circuit.db.pcb_component.getWhere({
    source_component_id: holder.source_component_id,
  })!
  const holderPads = circuit.db.pcb_smtpad.list({
    pcb_component_id: holderPcb.pcb_component_id,
  })
  expect(holderPads).toHaveLength(3)
  expect(holderPads.every((pad) => Boolean(pad.pcb_port_id))).toBe(true)
  expect(circuit.db.source_ambiguous_port_reference.list()).toEqual([])
  expect(circuit.db.source_trace_not_connected_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_port_not_connected_error.list()).toEqual([])

  // Inspect emitted copper, rather than source traces that only express intent.
  const connectivity = new PcbConnectivityMap(circuit.getCircuitJson())
  for (const [from, to] of keystone3002Connections) {
    const fromPort = circuit.selectOne(from) as Port
    const toPort = circuit.selectOne(to) as Port
    expect(fromPort.pcb_port_id).toBeTruthy()
    expect(toPort.pcb_port_id).toBeTruthy()
    expect(
      connectivity.connMap.areIdsConnected(
        fromPort.pcb_port_id!,
        toPort.pcb_port_id!,
      ),
    ).toBe(true)
  }
}
