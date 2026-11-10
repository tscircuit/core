import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("preserves named differential sections through an ESD tap on a shared net", async () => {
  const { circuit } = getTestFixture()
  const board = (routingDisabled: boolean, includeHints = false) => (
    <board
      width={24}
      height={16}
      routingDisabled={routingDisabled}
      schematicDisabled
      autorouter="auto_local"
      minTraceWidth={0.18}
      minTraceToPadEdgeClearance={0.1}
    >
      <chip
        name="SOC"
        footprint={differentialPairPathPads("pin8", "pin7")}
        pcbX={-6}
        pcbY={1}
      />
      <chip name="ESD" footprint={differentialPairPathPads()} pcbY={1} />
      <chip
        name="USB"
        footprint={differentialPairPathPads()}
        pcbX={6}
        pcbY={1}
      />
      <resistor
        name="TP"
        resistance={1000}
        footprint="0402"
        pcbX={0}
        pcbY={4}
      />
      <net name="USB_P" nominalTraceWidth={0.18} />
      <net name="USB_N" nominalTraceWidth={0.18} />
      <trace
        name="P_CPU"
        routingPhaseIndex={0}
        path={[".SOC > .pin8", ".ESD > .pin1", "net.USB_P"]}
      />
      <trace
        name="N_CPU"
        routingPhaseIndex={0}
        path={[".SOC > .pin7", ".ESD > .pin2", "net.USB_N"]}
      />
      <trace
        name="P_PORT"
        routingPhaseIndex={1}
        path={[".ESD > .pin1", ".USB > .pin1", "net.USB_P"]}
      />
      <trace
        name="N_PORT"
        routingPhaseIndex={1}
        path={[".ESD > .pin2", ".USB > .pin2", "net.USB_N"]}
      />
      <trace from="net.USB_P" to=".TP > .pin1" />
      {includeHints && <tracehint for=".SOC > .pin7" offset={{ x: 1, y: 0 }} />}
      {includeHints && <tracehint for=".TP > .pin1" offset={{ x: 0, y: -1 }} />}
      <differentialpair
        name="CPU_PAIR"
        positiveConnection="P_CPU"
        negativeConnection="N_CPU"
        maxLengthSkew={0.1}
      />
      <differentialpair
        name="PORT_PAIR"
        positiveConnection="P_PORT"
        negativeConnection="N_PORT"
        maxLengthSkew={0.2}
      />
      <autoroutingphase
        name="FIRST_PAIR"
        phaseIndex={0}
        autorouter="auto_local"
      />
      <autoroutingphase
        name="SECOND_PAIR"
        phaseIndex={1}
        autorouter="auto_local"
      />
      <pcbnotetext
        pcbY={6.5}
        text="ESD tap: two pair sections + one test-point branch"
        fontSize={0.45}
      />
      <pcbnotetext pcbX={-6} pcbY={-0.2} text="SOC P/N" fontSize={0.4} />
      <pcbnotetext pcbX={0} pcbY={-0.2} text="ESD P/N" fontSize={0.4} />
      <pcbnotetext pcbX={6} pcbY={-0.2} text="USB P/N" fontSize={0.4} />
      <pcbnotetext pcbX={2.8} pcbY={4} text="TP: USB_P tap" fontSize={0.4} />
      <pcbnotetext
        pcbY={-2}
        text="P and N reach USB through ESD; the P tap must stay connected."
        fontSize={0.4}
      />
      <pcbnotetext
        pcbY={-3.5}
        text={
          '<trace name="P_CPU" routingPhaseIndex={0} path={[".SOC > .pin8", ".ESD > .pin1", "net.USB_P"]} />'
        }
        fontSize={0.32}
      />
      <pcbnotetext
        pcbY={-4.4}
        text={
          '<trace name="P_PORT" routingPhaseIndex={1} path={[".ESD > .pin1", ".USB > .pin1", "net.USB_P"]} />'
        }
        fontSize={0.32}
      />
      <pcbnotetext
        pcbY={-5.3}
        text={'<trace from="net.USB_P" to=".TP > .pin1" />'}
        fontSize={0.32}
      />
      <pcbnotetext
        pcbY={-6.2}
        text="Routing view omits hints. Input fixture also includes trace hints."
        fontSize={0.32}
      />
    </board>
  )
  // Keep hint preservation covered at the SRJ boundary. The current routers
  // reject a hinted differential section with more than two input points.
  circuit.add(board(true, true))
  circuit.render()
  const before = structuredClone(circuit.getCircuitJson())
  const { simpleRouteJson: srj } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuitComponent: circuit.firstChild!,
  })
  const sourceTrace = (name: string) =>
    circuit.db.source_trace.getWhere({ name })!
  const section = (name: string) =>
    srj.connections.find(
      (c) => c.source_trace_id === sourceTrace(name).source_trace_id,
    )!
  for (const name of ["P_CPU", "N_CPU", "P_PORT", "N_PORT"]) {
    expect(section(name).width).toBe(0.18)
    expect(
      section(name)
        .pointsToConnect.filter((point) => point.pcb_port_id)
        .map((p) => circuit.db.pcb_port.get(p.pcb_port_id!)!.source_port_id),
    ).toEqual(sourceTrace(name).connected_source_port_ids)
  }
  expect(srj.differentialPairs).toEqual([
    {
      connectionNames: [[section("P_CPU").name], [section("N_CPU").name]],
      maxLengthSkewMm: 0.1,
    },
    {
      connectionNames: [[section("P_PORT").name], [section("N_PORT").name]],
      maxLengthSkewMm: 0.2,
    },
  ])
  const positiveNet = circuit.db.source_net.getWhere({ name: "USB_P" })!
  const negativeNet = circuit.db.source_net.getWhere({ name: "USB_N" })!
  const branch = srj.connections.find(
    (c) => c.name === positiveNet.source_net_id,
  )!
  expect(branch.pointsToConnect.filter((point) => point.pointId)).toHaveLength(
    2,
  )
  expect(branch.pointsToConnect.filter((point) => !point.pointId)).toHaveLength(
    1,
  )
  expect(
    section("N_CPU").pointsToConnect.filter((point) => !point.pointId),
  ).toHaveLength(1)
  expect(
    branch.pointsToConnect.some((p) => p.port_selector?.startsWith("TP.")),
  ).toBe(true)
  expect(
    srj.connections.some((c) => c.name === negativeNet.source_net_id),
  ).toBe(false)
  expect(srj.connections).toHaveLength(5)
  expect(circuit.getCircuitJson()).toEqual(before)
  const { circuit: routed } = getTestFixture()
  const asyncErrors: string[] = []
  routed.on("asyncEffect:end", (event) => {
    if (event.error) asyncErrors.push(String(event.error))
  })
  routed.add(board(false))
  await routed.renderUntilSettled()
  expect(asyncErrors).toEqual([])
  expect(
    routed.getCircuitJson().filter((e) => e.type.endsWith("_error")),
  ).toEqual([])
  expect(routed.db.pcb_trace.list()).toHaveLength(5)
  await expect(routed).toMatchPcbSnapshot(import.meta.path, {
    width: 1200,
    height: 800,
    showDebugObjects: false,
  })
}, 30_000)
