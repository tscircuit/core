import { expect, test } from "bun:test"
import type { ISubcircuit } from "lib/components/primitive-components/Group/Subcircuit/ISubcircuit"
import { Trace } from "lib/components/primitive-components/Trace/Trace"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subcircuit exposedNets creates a source trace to the parent net", async () => {
  const { circuit } = await getTestFixture()

  circuit.add(
    <board routingDisabled>
      <net name="GND" />
      <subcircuit name="S1" exposedNets={["GND"]}>
        <resistor
          name="R1"
          resistance="1k"
          connections={{ pin1: "net.GND", pin2: "net.LOCAL" }}
        />
      </subcircuit>
    </board>,
  )

  circuit.render()

  const subcircuit = circuit.firstChild?.children.find(
    (child) => child.name === "S1",
  ) as ISubcircuit | undefined
  expect(subcircuit?._parsedProps.exposedNets).toEqual(["GND"])

  const sourceNets = circuit.db.source_net.list()
  const gndNets = sourceNets.filter((net) => net.name === "GND")
  expect(gndNets.length).toBe(2)

  const childGndNet = gndNets.find(
    (net) => net.subcircuit_id === subcircuit?.subcircuit_id,
  )
  const parentGndNet = gndNets.find(
    (net) => net.subcircuit_id !== childGndNet?.subcircuit_id,
  )

  expect(childGndNet).toBeDefined()
  expect(parentGndNet).toBeDefined()

  const exposedNetTrace = circuit.db.source_trace.list().find((trace) => {
    const connectedNetIds = [...trace.connected_source_net_ids].sort()
    return (
      trace.connected_source_port_ids.length === 0 &&
      connectedNetIds.join(",") ===
        [childGndNet!.source_net_id, parentGndNet!.source_net_id]
          .sort()
          .join(",")
    )
  })

  expect(exposedNetTrace).toBeDefined()

  const exposedBridgeComponent = circuit
    .selectAll("trace")
    .find(
      (trace): trace is Trace =>
        trace instanceof Trace && trace._exposesSubcircuitConnection,
    )
  expect(exposedBridgeComponent?.source_trace_id).toBe(
    exposedNetTrace?.source_trace_id,
  )

  const localNet = sourceNets.find((net) => net.name === "LOCAL")
  expect(
    circuit.db.source_trace
      .list()
      .some(
        (trace) =>
          trace.connected_source_port_ids.length === 0 &&
          trace.connected_source_net_ids.includes(localNet!.source_net_id),
      ),
  ).toBe(false)
})
