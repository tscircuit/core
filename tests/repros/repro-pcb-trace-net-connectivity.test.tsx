import { expect, test } from "bun:test"
import type { PcbTraceProps } from "lib/components/primitive-components/PcbTrace"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type PcbTracePropsWithNetSelector = PcbTraceProps & {
  connectsTo: string
}

test("repro: authored PCB trace drops requested net connectivity", async () => {
  const { circuit } = getTestFixture()
  const requestedNetName = "GND"
  const authoredPcbTraceProps = {
    connectsTo: `net.${requestedNetName}`,
    route: [
      {
        route_type: "wire",
        x: -5.5,
        y: -1.4,
        width: 0.6,
        layer: "top",
      },
      {
        route_type: "wire",
        x: 5.5,
        y: -1.4,
        width: 0.6,
        layer: "top",
      },
    ],
  } satisfies PcbTracePropsWithNetSelector

  circuit.add(
    <board width={18} height={11} autorouter="none">
      <net
        name={requestedNetName}
        connectsTo={[".U1 > .pin1", ".U1 > .pin2"]}
      />
      <chip
        name="U1"
        pinLabels={{ pin1: "GND_A", pin2: "GND_B" }}
        noSchematicRepresentation
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-5.5}
              pcbY={-1.4}
              width={1.2}
              height={1.2}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={5.5}
              pcbY={-1.4}
              width={1.2}
              height={1.2}
              shape="rect"
            />
            <pcbtrace {...authoredPcbTraceProps} />
          </footprint>
        }
      />
      <pcbnotetext
        text={`REQUESTED NET: ${requestedNetName}`}
        pcbY={3.1}
        fontSize={0.7}
        color="#66ccff"
      />
      <pcbnotetext
        text="GND A"
        pcbX={-5.5}
        pcbY={-2.65}
        fontSize={0.4}
        color="#66ccff"
      />
      <pcbnotetext
        text="GND B"
        pcbX={5.5}
        pcbY={-2.65}
        fontSize={0.4}
        color="#66ccff"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTrace = circuit.db.pcb_trace.list()[0]
  const sourceTrace = pcbTrace.source_trace_id
    ? circuit.db.source_trace.get(pcbTrace.source_trace_id)
    : undefined
  const actualSourceNetName = sourceTrace?.connected_source_net_ids
    .map((sourceNetId) => circuit.db.source_net.get(sourceNetId)?.name)
    .find((sourceNetName) => sourceNetName !== undefined)
  circuit.db.pcb_note_text.insert({
    text: `TRACE NET: ${actualSourceNetName ?? "NONE"}`,
    anchor_position: { x: 0, y: 1.9 },
    anchor_alignment: "center",
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.7,
    color: actualSourceNetName ? "#55ff99" : "#ff5555",
  })
  expect(pcbTrace.source_trace_id).toBeUndefined()
  expect(actualSourceNetName).toBeUndefined()
  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
