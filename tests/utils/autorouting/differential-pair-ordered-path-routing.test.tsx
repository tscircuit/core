import { expect, test } from "bun:test"
import type { Port } from "lib/components/primitive-components/Port"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routes both three-pad differential lanes in written path order", async () => {
  const { circuit } = getTestFixture()
  const inputs: SimpleRouteJson[] = []
  circuit.on("autorouting:start", (event) => inputs.push(event.simpleRouteJson))
  circuit.add(
    <board width={22} height={10} schematicDisabled autorouter="auto_local">
      <chip
        name="J1"
        pcbX={-7}
        footprint={differentialPairPathPads()}
        pinLabels={{ pin1: "P", pin2: "N" }}
      />
      <chip
        name="ESD"
        footprint={differentialPairPathPads()}
        pinLabels={{ pin1: "P", pin2: "N" }}
      />
      <chip
        name="U1"
        pcbX={7}
        footprint={differentialPairPathPads()}
        pinLabels={{ pin1: "P", pin2: "N" }}
      />
      <trace name="D_P" path={["J1.pin1", "ESD.pin1", "U1.pin1"]} />
      <trace name="D_N" path={["J1.pin2", "ESD.pin2", "U1.pin2"]} />
      <differentialpair
        positiveConnection="D_P"
        negativeConnection="D_N"
        maxLengthSkew="0.1mm"
      />
      <pcbnotetext pcbX={-7} pcbY={1.5} fontSize={0.4} text="J1" />
      <pcbnotetext pcbY={1.5} fontSize={0.4} text="ESD" />
      <pcbnotetext pcbX={7} pcbY={1.5} fontSize={0.4} text="U1" />
      <pcbnotetext
        pcbY={3}
        fontSize={0.5}
        text="D_P and D_N: J1 -> ESD -> U1"
      />
      <pcbnotetext
        pcbY={-3}
        fontSize={0.4}
        text="Two ordered hops per lane; data flow only"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(inputs).toHaveLength(1)
  const srj = inputs[0]!
  const laneTraceIds = ["D_P", "D_N"].map(
    (name) => circuit.db.source_trace.getWhere({ name })!.source_trace_id,
  )
  const lanePaths = ["pin1", "pin2"].map((pin) =>
    ["J1", "ESD", "U1"].map((name) => {
      return circuit.firstChild!.selectOne<Port>(`.${name} > .${pin}`)!
        .pcb_port_id!
    }),
  )
  expect(
    laneTraceIds.map(
      (name) =>
        srj.connections.find((connection) => connection.name === name)!.path,
    ),
  ).toEqual(lanePaths)
  expect(srj.differentialPairs).toEqual([
    {
      connectionNames: [laneTraceIds[0]!, laneTraceIds[1]!],
      lengthTolerance: 0.1,
    },
  ])
  for (const [laneIndex, source_trace_id] of laneTraceIds.entries()) {
    const path = lanePaths[laneIndex]!
    const hops = circuit.db.pcb_trace
      .list()
      .filter((trace) => trace.source_trace_id === source_trace_id)
    expect(hops).toHaveLength(2)
    // PCB traces may be stored in either orientation. Traverse the emitted
    // endpoints in the declared path order, using each trace exactly once.
    for (const [index, to] of path.slice(1).entries()) {
      const endpoints = [path[index]!, to].sort()
      const matchingHops = hops.filter((trace) => {
        const portIds = trace.route.flatMap((point) =>
          point.route_type === "wire"
            ? [point.start_pcb_port_id, point.end_pcb_port_id].filter(
                (id) => id !== undefined,
              )
            : [],
        )
        return JSON.stringify(portIds.sort()) === JSON.stringify(endpoints)
      })
      expect(matchingHops).toHaveLength(1)
    }
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
