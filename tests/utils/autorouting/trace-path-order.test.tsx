import { expect, test } from "bun:test"
import type { Port } from "lib/components/primitive-components/Port"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// C sits between A and B. The written order C -> A -> B is not the shortest
// tree, which would link C-A and C-B.
const PathParts = () => (
  <>
    <pinheader name="A" pinCount={2} pcbX={-6} pcbY={-2} pcbRotation={90} />
    <pinheader name="B" pinCount={2} pcbX={6} pcbY={-2} pcbRotation={90} />
    <pinheader name="C" pinCount={2} pcbY={3} pcbRotation={90} />
    <pcbnotetext pcbY={-5} fontSize={0.45} text="Written order: C -> A -> B" />
  </>
)

test("exports the written order of every trace path", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={19} height={13} routingDisabled schematicDisabled>
      <PathParts />
      <pinheader name="TP" pinCount={1} pcbX={-6} pcbY={4} />
      <net name="SIG" />
      <trace path={["C.pin1", "A.pin1", "B.pin1"]} />
      <trace path={["C.pin2", "A.pin2", "B.pin2", "net.SIG"]} />
      <trace from="net.SIG" to="TP.pin1" />
    </board>,
  )
  circuit.render()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuitComponent: circuit.firstChild!,
  })
  const portId = (selector: string) =>
    circuit.firstChild!.selectOne<Port>(selector)!.pcb_port_id!

  expect(
    simpleRouteJson.connections.flatMap(({ path }) => (path ? [path] : [])),
  ).toEqual([
    [portId(".C > .pin1"), portId(".A > .pin1"), portId(".B > .pin1")],
    // `net.SIG` attaches the chain to the net; it is not a chain position.
    [portId(".C > .pin2"), portId(".A > .pin2"), portId(".B > .pin2")],
  ])
})

// TODO: passes once @tscircuit/capacity-autorouter is bumped to a release
// with tscircuit/tscircuit-autorouter#3708 (ordered `path` point pairs).
test("routes a trace path in the written order", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={19} height={13} schematicDisabled autorouter="auto_local">
      <PathParts />
      <trace path={["C.pin1", "A.pin1", "B.pin1"]} />
    </board>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const componentName = (pcbPortId: string) => {
    const pcbPort = circuit.db.pcb_port.get(pcbPortId)!
    const sourcePort = circuit.db.source_port.get(pcbPort.source_port_id)!
    return circuit.db.source_component.get(sourcePort.source_component_id!)!
      .name
  }
  const routedLinks = circuit.db.pcb_trace.list().map((trace) =>
    trace.route
      .flatMap((point) =>
        point.route_type === "wire"
          ? [point.start_pcb_port_id, point.end_pcb_port_id]
          : [],
      )
      .filter((id): id is string => Boolean(id))
      .map(componentName)
      .sort()
      .join("-"),
  )
  expect(routedLinks.sort()).toEqual(["A-B", "A-C"])
})
