import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bus routes through named nets retain source trace ownership", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={14} schematicDisabled routeRemaining={false}>
      <autoroutingphase name="DDR_DATA" phaseIndex={0} autorouter="bus_lanes" />
      <net name="DQ0" routingPhaseIndex={0} />
      <net name="DQ1" routingPhaseIndex={0} />
      {[-7, 7].map((pcbX, chipIndex) => (
        <chip
          key={chipIndex}
          name={chipIndex === 0 ? "CPU" : "RAM"}
          pcbX={pcbX}
          pinLabels={{ pin1: "DQ0", pin2: "DQ1" }}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                pcbY={2}
                shape="circle"
                radius={0.3}
              />
              <smtpad
                portHints={["pin2"]}
                pcbY={-2}
                shape="circle"
                radius={0.3}
              />
            </footprint>
          }
        />
      ))}
      <trace
        name="DATA0"
        path={[".CPU > .DQ0", ".RAM > .DQ0", "net.DQ0"]}
        routingPhaseIndex={0}
      />
      <trace
        name="DATA1"
        path={[".CPU > .DQ1", ".RAM > .DQ1", "net.DQ1"]}
        routingPhaseIndex={0}
      />
      <bus
        name="DDR_BYTE"
        connections={["DATA0", "DATA1"]}
        pcbAllowedLayers={["top"]}
        pcbTraceWidth={0.15}
        routingPhaseIndex={0}
      />
      <pcbnotetext pcbY={3.3} fontSize={0.5} text="CPU.DQ0 to RAM.DQ0" />
      <pcbnotetext pcbY={-0.7} fontSize={0.5} text="CPU.DQ1 to RAM.DQ1" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces).toHaveLength(2)
  const ownedPcbTraces = pcbTraces.filter(
    (pcbTrace) =>
      pcbTrace.source_trace_id &&
      circuit.db.source_trace.get(pcbTrace.source_trace_id),
  )
  circuit.db.pcb_note_text.insert({
    font: "tscircuit2024",
    text: `${ownedPcbTraces.length}/${pcbTraces.length} DDR routes linked to source traces`,
    anchor_position: { x: 0, y: -5 },
    anchor_alignment: "center",
    font_size: 0.55,
    layer: "top",
    color: "#ffcc00",
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
