import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { Net } from "lib/components/primitive-components/Net"

it("should create a Net component with correct properties", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <net name="VCC" />
    </board>,
  )

  project.render()

  const net = project.selectOne("net") as Net

  expect(net).not.toBeNull()
  expect(net.props.name).toBe("VCC")
  expect(net.getPortSelector()).toBe("net.VCC")
})

it("carries net highlightColor into pcb_trace.highlight_color", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm">
      <net name="VCC" highlightColor="#ff0000" />
      <net name="GND" />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={6} />
      <trace from=".R1 > .pin2" to="net.VCC" />
      <trace from=".R2 > .pin2" to="net.VCC" />
      <trace from=".R1 > .pin1" to="net.GND" />
      <trace from=".R2 > .pin1" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const netNameBySourceNetId = Object.fromEntries(
    circuitJson
      .filter((e: any) => e.type === "source_net")
      .map((e: any) => [e.source_net_id, e.name]),
  )
  const netIdsBySourceTraceId = Object.fromEntries(
    circuitJson
      .filter((e: any) => e.type === "source_trace")
      .map((e: any) => [e.source_trace_id, e.connected_source_net_ids ?? []]),
  )

  const highlightByNetName: Record<string, string | undefined> = {}
  for (const pcbTrace of circuitJson.filter(
    (e: any) => e.type === "pcb_trace",
  ) as any[]) {
    for (const netId of netIdsBySourceTraceId[pcbTrace.source_trace_id] ?? []) {
      highlightByNetName[netNameBySourceNetId[netId]] = pcbTrace.highlight_color
    }
  }

  // `NetProps.highlightColor` is documented and `pcb_trace.highlight_color`
  // exists on the circuit-JSON schema; the value used to be dropped entirely.
  expect(highlightByNetName.VCC).toBe("#ff0000")
  // A net without the prop must not pick one up.
  expect(highlightByNetName.GND).toBeUndefined()
})
