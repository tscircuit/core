import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a phase targeting a pin routes its named net while an unrelated net stays deferred", async () => {
  const { circuit } = getTestFixture()
  const started: string[] = []
  circuit.on("autorouting:start", (event) =>
    started.push(event.phaseName ?? "remaining"),
  )
  circuit.add(
    <board
      width={24}
      height={14}
      schematicDisabled
      routeRemaining={false}
      autorouter="auto_local"
    >
      <chip name="U1" pcbX={-6} footprint="soic8" />
      <chip name="U2" pcbX={6} footprint="soic8" />
      <trace from=".U1 > .pin8" to="net.DATA" />
      <trace from=".U2 > .pin1" to="net.DATA_ALIAS" />
      <trace from="net.DATA" to="net.DATA_ALIAS" />
      <trace from=".U1 > .pin7" to="net.LATER" />
      <trace from=".U2 > .pin2" to="net.LATER" />
      <autoroutingphase
        name="DATA_ONLY"
        phaseIndex={0}
        connections={[".U2 > .pin1"]}
      />
      <pcbnotetext
        pcbY={-4.5}
        text="DATA phase: U1.8 to U2.1"
        fontSize={0.55}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const wires = circuit.db.pcb_trace.list()
  expect(started).toEqual(["DATA_ONLY"])
  expect(wires).toHaveLength(1)
  const ports = circuit.db.pcb_port.list()
  const endPortIds = wires[0]!.route.flatMap((point) =>
    point.route_type === "wire"
      ? [point.start_pcb_port_id, point.end_pcb_port_id].filter(Boolean)
      : [],
  )
  const names = endPortIds.map((id) => {
    const port = ports.find((p) => p.pcb_port_id === id)!
    return circuit.db.source_port.get(port.source_port_id)?.pin_number
  })
  expect(names.sort()).toEqual([1, 8])
  expect({ started, traceCount: wires.length }).toMatchSnapshot()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
