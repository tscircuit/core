import { expect, test } from "bun:test"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"
import type { PcbTrace } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("net-owned shared branches retain their net without an exact source trace", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={10} schematicDisabled routingDisabled>
      {[-4, 0, 4].map((pcbX, chipIndex) => (
        <chip
          key={chipIndex}
          name={`U${chipIndex + 1}`}
          pcbX={pcbX}
          connections={chipIndex === 0 ? { pin1: "net.DATA" } : undefined}
          footprint={
            <footprint>
              <smtpad portHints={["pin1"]} shape="circle" radius={0.3} />
            </footprint>
          }
        />
      ))}
      <trace name="LOCAL_LEFT" from="U1.pin1" to="U2.pin1" maxLength={5} />
      <trace name="LOCAL_RIGHT" from="U2.pin1" to="U3.pin1" maxLength={5} />
      <pcbnotetext
        pcbY={2}
        fontSize={0.5}
        text="Shared DATA branch: U1 to U3"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const sourceNet = circuit.db.source_net.list()[0]!
  const sharedBranch: PcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "shared_data_branch",
    source_trace_id: sourceNet.source_net_id,
    route: [
      { route_type: "wire", x: -4, y: 0, width: 0.15, layer: "top" },
      { route_type: "wire", x: 4, y: 0, width: 0.15, layer: "top" },
    ],
  }
  const sharedSourceId = getSourceTraceIdForRoutedTrace({
    db: circuit.db,
    trace: sharedBranch,
  })
  expect(sharedSourceId).toBe(sourceNet.source_net_id)
  expect(
    getSourceTraceIdForRoutedTrace({
      db: circuit.db,
      trace: {
        ...sharedBranch,
        route: [
          { route_type: "wire", x: -4, y: 0, width: 0.15, layer: "top" },
          { route_type: "wire", x: 0, y: 0, width: 0.15, layer: "top" },
        ],
      },
    }),
  ).toBe(
    circuit.db.source_trace.list().find((trace) => trace.name === "LOCAL_LEFT")!
      .source_trace_id,
  )
  expect(
    getSourceTraceIdForRoutedTrace({
      db: circuit.db,
      trace: {
        ...sharedBranch,
        route: [
          {
            route_type: "via",
            x: 1,
            y: 1,
            from_layer: "top",
            to_layer: "bottom",
          },
        ],
      },
    }),
  ).toBe(sourceNet.source_net_id)
  circuit.db.pcb_trace.insert({
    ...sharedBranch,
    source_trace_id: sharedSourceId,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
