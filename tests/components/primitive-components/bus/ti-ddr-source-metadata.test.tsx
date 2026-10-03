import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"
import { getBusesForSimpleRouteJson } from "lib/utils/autorouting/getBusesForSimpleRouteJson"
import { Bus } from "lib/components/primitive-components/Bus"

test("TI DDR intent and resolved pair polarity survive TSX rendering without changing routing groups", () => {
  const circuit = new RootCircuit()
  circuit.add(
    <board width={30} height={20} routingDisabled>
      <chip name="U1" footprint="soic8" pcbX={-7} />
      <chip name="U2" footprint="soic8" pcbX={7} />
      <trace name="DATA" from=".U1 > .pin1" to=".U2 > .pin1" />
      <trace name="CLOCK_P" from=".U1 > .pin2" to=".U2 > .pin2" />
      <trace name="CLOCK_N" from=".U1 > .pin3" to=".U2 > .pin3" />
      <bus
        name="DATA_BYTE"
        routingDisabled
        connections={["DATA"]}
        targetImpedance="60ohm"
        pcbDdrRouting={{
          profile: "ti_am335x_ddr3",
          interfaceName: "MEMORY",
          topology: "one_x16",
          signalClass: "dq",
          byteIndex: 0,
          groundNetName: "GND",
          powerNetName: "DDR_1V5",
        }}
      />
      <differentialpair
        name="CLOCK"
        positiveConnection="CLOCK_P"
        negativeConnection="CLOCK_N"
        targetDifferentialImpedance="120ohm"
        pcbTraceGap="0.12mm"
        maxUncoupledLength="0.5mm"
        pcbDdrRouting={{
          profile: "ti_am335x_ddr3",
          interfaceName: "MEMORY",
          topology: "one_x16",
          signalClass: "ck",
        }}
      />
    </board>,
  )
  circuit.render()
  const buses = circuit.db.source_bus.list()
  const data = buses.find((b) => b.name === "DATA_BYTE")!
  expect(data).toMatchObject({
    target_impedance: 60,
    ddr_routing: {
      profile: "ti_am335x_ddr3",
      interface_name: "MEMORY",
      signal_class: "dq",
      byte_index: 0,
      topology: "one_x16",
      ground_net_name: "GND",
      power_net_name: "DDR_1V5",
    },
  })
  const clock = buses.find((b) => b.name === "CLOCK")!
  expect(clock).toMatchObject({
    target_differential_impedance: 120,
    ddr_routing: { signal_class: "ck" },
    differential_pair: {
      positive_source_trace_id: circuit.db.source_trace.getWhere({
        name: "CLOCK_P",
      })!.source_trace_id,
      negative_source_trace_id: circuit.db.source_trace.getWhere({
        name: "CLOCK_N",
      })!.source_trace_id,
      trace_gap: 0.12,
      max_uncoupled_length: 0.5,
    },
  })
  const bus = circuit.selectOne(".DATA_BYTE")!
  if (!(bus instanceof Bus)) throw Error("Missing DATA_BYTE bus")
  expect(
    getBusesForSimpleRouteJson({
      srjConnections: [],
      buses: [bus],
      sourceTraces: circuit.db.source_trace.list(),
    }),
  ).toBeUndefined()
})
