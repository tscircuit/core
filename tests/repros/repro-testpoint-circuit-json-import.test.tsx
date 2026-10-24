import { expect, test } from "bun:test"
import type { AnyCircuitElement, PcbTraceRoutePoint } from "circuit-json"
import type { RootCircuit } from "lib/RootCircuit"
import { getTestPointInflationFixture } from "tests/fixtures/get-testpoint-inflation-fixture"

const describeElement = (element: AnyCircuitElement | PcbTraceRoutePoint) =>
  Object.fromEntries(
    Object.entries(element).filter(
      ([key]) =>
        !key.endsWith("_id") &&
        !key.endsWith("_ids") &&
        key !== "subcircuit_connectivity_map_key" &&
        key !== "port_hints",
    ),
  )

const describeTestPoints = (circuit: RootCircuit) =>
  circuit.db.source_component
    .list()
    .filter((source) => source.ftype === "simple_test_point")
    .map((source) => {
      const pcb = circuit.db.pcb_component.getWhere({
        source_component_id: source.source_component_id,
      })!
      return {
        source: describeElement(source),
        placement: {
          center: pcb.center,
          rotation: pcb.rotation,
          layer: pcb.layer,
        },
        pads: circuit.db.pcb_smtpad
          .list({ pcb_component_id: pcb.pcb_component_id })
          .map(describeElement),
        holes: circuit.db.pcb_plated_hole
          .list({ pcb_component_id: pcb.pcb_component_id })
          .map(describeElement),
        sourcePorts: circuit.db.source_port
          .list({ source_component_id: source.source_component_id })
          .map(describeElement),
        pcbPorts: circuit.db.pcb_port
          .list({ pcb_component_id: pcb.pcb_component_id })
          .map(describeElement),
        labels: circuit.db.pcb_silkscreen_text
          .list({ pcb_component_id: pcb.pcb_component_id })
          .map(describeElement),
      }
    })

const describeConnections = (circuit: RootCircuit) =>
  circuit.db.source_trace.list().map((trace) => ({
    ports: trace.connected_source_port_ids.map((portId) => {
      const port = circuit.db.source_port.get(portId)!
      const source = circuit.db.source_component.get(port.source_component_id!)!
      return `${source.name}.${port.name}`
    }),
    nets: trace.connected_source_net_ids.map(
      (netId) => circuit.db.source_net.get(netId)!.name,
    ),
  }))

const describeCopper = (circuit: RootCircuit) => ({
  traces: circuit.db.pcb_trace.list().map((trace) => ({
    ...describeElement(trace),
    route: trace.route.map(describeElement),
  })),
  vias: circuit.db.pcb_via.list().map(describeElement),
})

test("AM3352 USB-C output probe round-trips through Circuit JSON", async () => {
  const { original, imported, importError } =
    await getTestPointInflationFixture()

  expect(original.db.pcb_smtpad.list()).toHaveLength(3)
  expect(original.db.pcb_plated_hole.list()).toHaveLength(0)
  expect(original.db.source_trace.list()).toHaveLength(2)
  expect(original.db.pcb_trace.list()).toHaveLength(1)
  expect(original.db.pcb_via.list()).toHaveLength(0)
  expect(importError).toBeUndefined()
  expect(describeTestPoints(imported)).toEqual(describeTestPoints(original))
  expect(describeConnections(imported)).toEqual(describeConnections(original))
  expect(describeCopper(imported)).toEqual(describeCopper(original))
  expect(imported.db.pcb_silkscreen_text.list().map(describeElement)).toEqual(
    original.db.pcb_silkscreen_text.list().map(describeElement),
  )
  for (const port of original.db.source_port.list()) {
    const source = original.db.source_component.get(port.source_component_id!)!
    if (source.ftype !== "simple_test_point") continue
    const importedSource = imported.db.source_component.getWhere({
      name: source.name,
    })!
    const importedPort = imported.db.source_port.getWhere({
      source_component_id: importedSource.source_component_id,
      name: port.name,
    })!
    expect(importedPort.port_hints).toEqual(
      expect.arrayContaining(port.port_hints ?? []),
    )
  }
  expect(
    imported
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
})
