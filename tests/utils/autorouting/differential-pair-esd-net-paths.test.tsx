import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("preserves named differential sections through an ESD tap on a shared net", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={32} height={20} routingDisabled schematicDisabled>
      <chip name="SOC" footprint="soic8" pcbX={-10} />
      <chip name="ESD" footprint="soic8" />
      <chip name="USB" footprint="soic8" pcbX={10} />
      <resistor name="TP" resistance={1000} footprint="0402" pcbY={6} />
      <net name="USB_P" nominalTraceWidth={0.18} />
      <net name="USB_N" nominalTraceWidth={0.18} />
      <trace
        name="P_CPU"
        path={[".SOC > .pin8", ".ESD > .pin1", "net.USB_P"]}
      />
      <trace
        name="N_CPU"
        path={[".SOC > .pin7", ".ESD > .pin2", "net.USB_N"]}
      />
      <trace
        name="P_PORT"
        path={[".ESD > .pin1", ".USB > .pin1", "net.USB_P"]}
      />
      <trace
        name="N_PORT"
        path={[".ESD > .pin2", ".USB > .pin2", "net.USB_N"]}
      />
      <trace from="net.USB_P" to=".TP > .pin1" />
      <tracehint for=".SOC > .pin7" offset={{ x: 1, y: 0 }} />
      <tracehint for=".TP > .pin1" offset={{ x: 0, y: -1 }} />
      <differentialpair
        name="CPU_PAIR"
        positiveConnection="P_CPU"
        negativeConnection="N_CPU"
        maxLengthSkew={0.1}
        pcbTraceGap={0.15}
        maxUncoupledLength={0.5}
      />
      <differentialpair
        name="PORT_PAIR"
        positiveConnection="P_PORT"
        negativeConnection="N_PORT"
        maxLengthSkew={0.2}
        pcbTraceGap={0.2}
      />
      <pcbnotetext
        pcbY={-6}
        text="SOC → ESD → USB: preserve both named pair sections"
        fontSize={0.65}
      />
      <pcbnotetext
        pcbY={-7.5}
        text="USB_P test-point branch stays connected; no duplicate trunk"
        fontSize={0.55}
      />
    </board>,
  )
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
      connectionNames: [section("P_CPU").name, section("N_CPU").name],
      lengthTolerance: 0.1,
      traceGap: 0.15,
      maxUncoupledLength: 0.5,
    },
    {
      connectionNames: [section("P_PORT").name, section("N_PORT").name],
      lengthTolerance: 0.2,
      traceGap: 0.2,
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
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
