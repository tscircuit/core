import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { expectDifferentialPairLengths } from "tests/fixtures/expect-differential-pair-lengths"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("normalizes two-pad nets into canonical hops and round-trips saved Circuit JSON", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={12} schematicDisabled autorouter="auto_local">
      <chip
        name="J1"
        pcbX={-7}
        footprint={differentialPairPathPads()}
        connections={{ pin1: "net.P", pin2: "net.N" }}
      />
      <chip
        name="MCU"
        pcbX={7}
        footprint={differentialPairPathPads()}
        connections={{ pin1: "net.P", pin2: "net.N" }}
      />
      <differentialpair
        name="USB"
        positiveConnection="net.P"
        negativeConnection="net.N"
        maxLengthSkew={0}
      />
      <pcbnotetext
        pcbY={3}
        text="Two-pad nets: canonical P / N hops, zero skew"
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const pair = circuit.db.source_bus.getWhere({ name: "USB" })!
  expect(pair.source_trace_ids).toHaveLength(2)
  expect(
    pair.source_trace_ids.map(
      (id) => circuit.db.source_trace.get(id)!.connected_source_port_ids.length,
    ),
  ).toEqual([2, 2])
  expect(
    circuit.db.source_trace
      .list()
      .filter((trace) => trace.connected_source_port_ids.length === 1),
  ).toHaveLength(4)
  expectDifferentialPairLengths(circuit)
  const json = circuit
    .getCircuitJson()
    .filter(
      (element) => element.type !== "pcb_trace" && element.type !== "pcb_via",
    )
  const live = getSimpleRouteJsonFromCircuitJson({
    circuitJson: json,
    subcircuitComponent: circuit.firstChild!,
  })
  const saved = getSimpleRouteJsonFromCircuitJson({
    circuitJson: JSON.parse(JSON.stringify(json)),
  })
  expect(saved.simpleRouteJson).toEqual(live.simpleRouteJson)
  expect(saved.differentialPairSourceBusIds).toEqual([pair.source_bus_id])
  expect(saved.simpleRouteJson.connections).toHaveLength(2)
  expect(saved.simpleRouteJson.differentialPairs).toEqual([
    {
      connectionNames: [
        [pair.source_trace_ids[0]!],
        [pair.source_trace_ids[1]!],
      ],
      maxLengthSkewMm: 0,
    },
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
    showErrorsInTextOverlay: true,
  })
})
