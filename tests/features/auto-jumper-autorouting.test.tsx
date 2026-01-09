import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import * as fs from "node:fs"

test("board with auto_jumper autorouter for single layer with crossing traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="18mm" height="22mm" layers={1} autorouter="auto_jumper">
      <chip
        footprint="dip16_w14"
        name="U1"
        connections={{
          pin1: "U1.pin9",
          pin2: "U1.pin10",
          pin3: "U1.pin11",
          pin4: "U1.pin12",
          pin5: "U1.pin13",
          pin6: "U1.pin14",
          pin7: "U1.pin15",
          pin8: "U1.pin16",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Match against a PCB snapshot to verify routing with jumpers
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  // Verify that we have PCB traces in the output
  const traces = circuit.selectAll("trace")
  expect(traces.length).toBeGreaterThan(0)

  // Verify autoplaced jumper has full circuit JSON elements
  const jumperComponent = circuit.db.source_component
    .list()
    .find((c) => c.name?.startsWith("__autoplaced_jumper"))
  expect(jumperComponent).toBeDefined()

  // Verify source_ports exist for the jumper
  const jumperSourcePorts = circuit.db.source_port
    .list()
    .filter(
      (p) => p.source_component_id === jumperComponent!.source_component_id,
    )
  expect(jumperSourcePorts.length).toBe(8) // 1206x4 jumper has 8 pads

  // Verify pcb_ports exist for the jumper
  const jumperPcbComponent = circuit.db.pcb_component
    .list()
    .find((c) => c.source_component_id === jumperComponent!.source_component_id)
  expect(jumperPcbComponent).toBeDefined()

  const jumperPcbPorts = circuit.db.pcb_port
    .list()
    .filter((p) => p.pcb_component_id === jumperPcbComponent!.pcb_component_id)
  expect(jumperPcbPorts.length).toBe(8)

  // Verify internal connections exist for the jumper
  const internalConnections = circuit.db.source_component_internal_connection
    .list()
    .filter(
      (c) => c.source_component_id === jumperComponent!.source_component_id,
    )
  expect(internalConnections.length).toBe(4) // 4 pairs of internally connected pins

  // Verify connectivity map recognizes jumper connections
  const circuitJson = circuit.getCircuitJson()
  // fs.writeFileSync("circuit.json", JSON.stringify(circuitJson, null, 2))
  const connectivityMap = getFullConnectivityMapFromCircuitJson(circuitJson)

  // U1.pin1 should be connected to U1.pin9 (via trace and possibly through jumper)
  const u1Pin1Port = circuit.db.source_port
    .list()
    .find(
      (p) =>
        p.name === "pin1" && p.source_component_id === "source_component_0",
    )
  const u1Pin9Port = circuit.db.source_port
    .list()
    .find(
      (p) =>
        p.name === "pin9" && p.source_component_id === "source_component_0",
    )

  expect(u1Pin1Port).toBeDefined()
  expect(u1Pin9Port).toBeDefined()

  // Both ports should be in the same connectivity net
  const pin1NetId = connectivityMap.getNetConnectedToId(
    u1Pin1Port!.source_port_id,
  )
  const pin9NetId = connectivityMap.getNetConnectedToId(
    u1Pin9Port!.source_port_id,
  )

  expect(pin1NetId).toBeDefined()
  expect(pin9NetId).toBeDefined()
  expect(pin1NetId).toBe(pin9NetId)
})
