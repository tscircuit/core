import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Regression: a standalone `<platedhole connectsTo="net.X">` (i.e.,
// not nested inside a chip footprint with `portHints`) must produce a
// real electrical connection in the netlist. Previously the prop
// typechecked and the hole rendered, but the runtime never consumed
// `connectsTo` — no port was created, no source_trace was emitted, so
// downstream consumers (KiCad / gerber export, autorouter, schematic
// net-label resolution) saw the hole as floating.

test("standalone <platedhole> with connectsTo creates a source_trace to the named net", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={0}
        pcbY={0}
        connections={{ pin1: "net.SIG", pin2: "net.GND" }}
      />
      {/* Standalone plated hole — no parent chip, no portHints. */}
      <platedhole
        name="PH_SIG"
        connectsTo="net.SIG"
        shape="circle"
        holeDiameter="0.6mm"
        outerDiameter="1.0mm"
        pcbX={5}
        pcbY={0}
      />
    </board>,
  )

  circuit.render()

  // 1. The platedhole landed in the PCB DB.
  const platedHoles = circuit.db.pcb_plated_hole.list()
  expect(platedHoles.length).toBe(1)

  // 2. A pcb_port was created for the hole. The port carries the
  //    pcb_port_id link from the platedhole record itself.
  const phRecord = platedHoles[0]
  expect(phRecord!.pcb_port_id).toBeTruthy()

  const pcbPort = circuit.db.pcb_port.get(phRecord!.pcb_port_id!)
  expect(pcbPort).toBeDefined()

  // 3. The source_port for that pcb_port is connected (by
  //    subcircuit_connectivity_map_key) to the same net that R1.pin1
  //    is on (net.SIG). The simplest expression of "connected" we can
  //    check is that a source_trace exists with both endpoints in the
  //    SIG-net's connectivity group.
  const traces = circuit.db.source_trace.list()
  const sigNet = circuit.db.source_net.list().find((n) => n.name === "SIG")
  expect(sigNet).toBeDefined()

  const tracesOnSigNet = traces.filter((t) =>
    (t.connected_source_net_ids ?? []).includes(sigNet!.source_net_id),
  )
  // At minimum, R1.pin1 → net.SIG and PH_SIG.pin1 → net.SIG both join
  // the same connectivity group via two source_traces.
  expect(tracesOnSigNet.length).toBeGreaterThanOrEqual(2)
})

test("connectsTo with multiple targets emits a source_trace per target", async () => {
  // Less common but supported by the prop schema (string[] allowed).
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={-3} pcbY={0}
        connections={{ pin1: "net.A", pin2: "net.GND" }} />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={3} pcbY={0}
        connections={{ pin1: "net.B", pin2: "net.GND" }} />
      <platedhole
        name="PH_AB"
        connectsTo={["net.A", "net.B"]}
        shape="circle"
        holeDiameter="0.6mm"
        outerDiameter="1.0mm"
        pcbX={0}
        pcbY={5}
      />
    </board>,
  )

  circuit.render()

  // The hole's pin1 should appear in both connectivity groups (A and B).
  const phRecord = circuit.db.pcb_plated_hole.list()[0]
  expect(phRecord!.pcb_port_id).toBeTruthy()
  const sourcePortId = circuit.db.pcb_port.get(phRecord!.pcb_port_id!)
    ?.source_port_id
  expect(sourcePortId).toBeTruthy()

  const traces = circuit.db.source_trace.list()
  const phTraces = traces.filter((t) =>
    (t.connected_source_port_ids ?? []).includes(sourcePortId!),
  )
  expect(phTraces.length).toBe(2)
})

test("portHints path still works when platedhole is inside a chip footprint", async () => {
  // Regression for the chip-internal use of <platedhole portHints={[...]}/>:
  // the new connectsTo path must not interfere when the platedhole is a
  // footprint child whose port is matched via portHints.
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="J1"
        pinLabels={{ pin1: ["A"], pin2: ["B"] }}
        connections={{ A: "net.SIG", B: "net.GND" }}
        footprint={
          <footprint>
            <platedhole
              shape="circle"
              holeDiameter="0.6mm"
              outerDiameter="1.0mm"
              pcbX="0mm"
              pcbY="0mm"
              portHints={["pin1"]}
            />
            <platedhole
              shape="circle"
              holeDiameter="0.6mm"
              outerDiameter="1.0mm"
              pcbX="2mm"
              pcbY="0mm"
              portHints={["pin2"]}
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const platedHoles = circuit.db.pcb_plated_hole.list()
  expect(platedHoles.length).toBe(2)
  for (const ph of platedHoles) {
    expect(ph.pcb_port_id).toBeTruthy()
  }
})
