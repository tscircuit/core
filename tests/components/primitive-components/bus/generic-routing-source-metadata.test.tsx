import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"
import { getBusesForSimpleRouteJson } from "lib/utils/autorouting/getBusesForSimpleRouteJson"
import { Bus } from "lib/components/primitive-components/Bus"

test("natural constraints resolve later-declared pairs and preserve electrical membership", () => {
  const circuit = new RootCircuit()
  circuit.add(
    <board width={30} height={20} routingDisabled>
      <chip name="U1" footprint="soic8" pcbX={-7} />
      <chip name="U2" footprint="soic8" pcbX={7} />
      <bus
        name="DATA_BYTE"
        connections={["DATA"]}
        lengthMatchTo=".CLOCK"
        maxLengthSkew="25mil"
        maxLength={{
          reference: "longest_manhattan",
          of: [".CLOCK"],
          offset: "25mil",
        }}
        pcbTraceSpacing="3w"
        pcbSpacingToOtherSignals="4w"
        targetImpedance="50±25ohm"
      />
      <trace name="DATA" from=".U1 > .pin1" to=".U2 > .pin1" />
      <trace name="CLOCK_P" from=".U1 > .pin2" to=".U2 > .pin2" />
      <trace name="CLOCK_N" from=".U1 > .pin3" to=".U2 > .pin3" />
      <differentialpair
        name="CLOCK"
        positiveConnection="CLOCK_P"
        negativeConnection="CLOCK_N"
        targetDifferentialImpedance="125±25ohm"
        pcbTraceGap="0.12mm"
        maxUncoupledLength="0.5mm"
        targetLength={{
          reference: "longest_manhattan",
          of: [".DATA_BYTE", ".U1 > .pin2"],
          offset: "300mil",
        }}
        lengthTolerance="50mil"
        pcbSpacingToOtherSignals="0.4mm"
      />
    </board>,
  )
  circuit.render()
  const traceId = (name: string) =>
    circuit.db.source_trace.getWhere({ name })!.source_trace_id
  const clockIds = [traceId("CLOCK_P"), traceId("CLOCK_N")]
  const data = circuit.db.source_bus.getWhere({ name: "DATA_BYTE" })!
  expect(data).toMatchObject({
    source_trace_ids: [traceId("DATA")],
    length_match_source_trace_ids: clockIds,
    max_length_skew: 0.635,
    max_length: {
      reference: "longest_manhattan",
      source_trace_ids: clockIds,
      offset: 0.635,
    },
    pcb_trace_spacing: { width_multiplier: 3 },
    pcb_spacing_to_other_signals: { width_multiplier: 4 },
    target_impedance: 50,
    target_impedance_min: 25,
    target_impedance_max: 75,
  })
  const clock = circuit.db.source_bus.getWhere({ name: "CLOCK" })!
  expect(clock).toMatchObject({
    target_differential_impedance: 125,
    target_differential_impedance_min: 100,
    target_differential_impedance_max: 150,
    target_length: {
      reference: "longest_manhattan",
      source_trace_ids: [traceId("DATA"), traceId("CLOCK_P")],
      offset: 7.62,
    },
    length_tolerance: 1.27,
    pcb_spacing_to_other_signals: 0.4,
    differential_pair: {
      positive_source_trace_id: clockIds[0],
      negative_source_trace_id: clockIds[1],
      trace_gap: 0.12,
      max_uncoupled_length: 0.5,
    },
  })
  const bus = circuit.selectOne(".DATA_BYTE")!
  if (!(bus instanceof Bus)) throw Error("Missing DATA_BYTE bus")
  const routed = getBusesForSimpleRouteJson({
    buses: [bus],
    sourceTraces: circuit.db.source_trace.list(),
    srjConnections: ["DATA", "CLOCK_P", "CLOCK_N"].map((name) => ({
      name,
      source_trace_id: traceId(name),
      pointsToConnect: [],
    })),
  })
  expect(routed?.[0]?.connectionNames).toEqual(["DATA", "CLOCK_P", "CLOCK_N"])
  expect(routed?.[0]?.maxLengthSkew).toBe(0.635)
  expect(data.source_trace_ids).toEqual([traceId("DATA")])
})
