import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Footprint-local points in right-handed mm: +X right, +Y up, +Z top.
const pads = () => (
  <footprint>
    <smtpad
      portHints={["pin1"]}
      pcbX={0}
      pcbY={0.5}
      width={0.6}
      height={0.6}
      shape="rect"
    />
    <smtpad
      portHints={["pin2"]}
      pcbX={0}
      pcbY={-0.5}
      width={0.6}
      height={0.6}
      shape="rect"
    />
  </footprint>
)

test("reproduces unrouted net-attached pair sections at the ESD pads", async () => {
  const { circuit } = getTestFixture()
  const asyncErrors: string[] = []
  circuit.on("asyncEffect:end", (event) => {
    if (event.error) asyncErrors.push(String(event.error))
  })
  circuit.add(
    <board
      width={26}
      height={16}
      schematicDisabled
      routeRemaining={false}
      minTraceWidth={0.1}
      minTraceToPadEdgeClearance={0.1}
    >
      <chip
        name="SOC"
        footprint={pads()}
        pcbX={-6}
        pinLabels={{ pin1: "P", pin2: "N" }}
      />
      <chip
        name="ESD"
        footprint={pads()}
        pinLabels={{ pin1: "P", pin2: "N" }}
      />
      <chip
        name="USB"
        footprint={pads()}
        pcbX={6}
        pinLabels={{ pin1: "P", pin2: "N" }}
      />
      <autoroutingphase
        name="CPU_TO_ESD"
        phaseIndex={0}
        autorouter="bus_lanes"
      />
      <autoroutingphase
        name="ESD_TO_USB"
        phaseIndex={1}
        autorouter="auto_local"
      />
      <trace
        name="P_CPU"
        path={[".SOC > .P", ".ESD > .P", "net.USB_P"]}
        routingPhaseIndex={0}
      />
      <trace
        name="N_CPU"
        path={[".SOC > .N", ".ESD > .N", "net.USB_N"]}
        routingPhaseIndex={0}
      />
      <trace
        name="P_PORT"
        path={[".ESD > .P", ".USB > .P", "net.USB_P"]}
        routingPhaseIndex={1}
      />
      <trace
        name="N_PORT"
        path={[".ESD > .N", ".USB > .N", "net.USB_N"]}
        routingPhaseIndex={1}
      />
      <differentialpair
        name="CPU_PAIR"
        positiveConnection="P_CPU"
        negativeConnection="N_CPU"
        maxLengthSkew={0.1}
        pcbTraceGap={0.15}
      />
      <differentialpair
        name="PORT_PAIR"
        positiveConnection="P_PORT"
        negativeConnection="N_PORT"
        maxLengthSkew={0.1}
        pcbTraceGap={0.15}
      />
      <bus
        name="CPU_BUS"
        connections={["P_CPU", "N_CPU"]}
        pcbAllowedLayers={["top"]}
        maxLengthSkew={0.1}
      />
      <bus
        name="PORT_BUS"
        connections={["P_PORT", "N_PORT"]}
        pcbAllowedLayers={["top"]}
        maxLengthSkew={0.1}
      />
      <pcbnotetext pcbX={-6} pcbY={-1.4} text="SOC P/N" fontSize={0.35} />
      <pcbnotetext pcbX={0} pcbY={-1.4} text="ESD P/N" fontSize={0.35} />
      <pcbnotetext pcbX={6} pcbY={-1.4} text="USB P/N" fontSize={0.35} />
      <pcbnotetext
        pcbY={3}
        text="SOC → ESD → USB: explicit pair sections on shared nets"
        fontSize={0.4}
      />
      <pcbnotetext
        pcbY={-3}
        text="Expected: P and N copper from SOC through ESD to USB"
        fontSize={0.4}
      />
      <pcbnotetext
        pcbY={-4.5}
        fontSize={0.35}
        text={
          '<trace name="P_CPU" path={[".SOC > .P", ".ESD > .P", "net.USB_P"]} />'
        }
      />
      <pcbnotetext
        pcbY={-5.3}
        fontSize={0.35}
        text={
          '<trace name="P_PORT" path={[".ESD > .P", ".USB > .P", "net.USB_P"]} />'
        }
      />
      <pcbnotetext
        pcbY={-6.1}
        fontSize={0.35}
        text={
          '<differentialpair positiveConnection="P_CPU" negativeConnection="N_CPU" />'
        }
      />
      <pcbnotetext
        pcbY={-6.9}
        fontSize={0.35}
        text="N follows the same path. CPU: bus-lanes; USB: auto-local."
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(asyncErrors).toEqual([
    'Error: Could not find an SRJ connection for trace name or port selector "P_CPU" in differential pair "CPU_PAIR"',
  ])
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  // Capture the actual failed render without asking the snapshot helper to rerender.
  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path, {
    width: 1200,
    height: 750,
    showDebugObjects: false,
  })
}, 30_000)
