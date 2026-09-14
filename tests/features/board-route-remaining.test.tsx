import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routeRemaining skips implicit routing while retaining explicit phases and unrouted DRC", async () => {
  const panels: string[] = []
  const descriptions: Record<string, string> = {
    disabled: "false: only the selected numbered phase runs",
    enabled: "true: the remaining connection is routed too",
    default: "omitted: preserves automatic remaining routing",
    no_phases: "false + no phases: both connections stay unrouted",
    unnumbered: "false + explicit untargeted phase: routes both",
    nested: "false: inherited by a nested subcircuit",
    targeted: "false + unnumbered phase: only selected pins route",
    trace_phase: "false: an explicit trace phase index still routes",
    breakout: "false: the explicit breakout still routes",
  }
  for (const scenario of [
    { name: "disabled", routeRemaining: false, phase: "numbered", routed: 1 },
    { name: "enabled", routeRemaining: true, phase: "numbered", routed: 2 },
    {
      name: "default",
      routeRemaining: undefined,
      phase: "numbered",
      routed: 2,
    },
    { name: "no_phases", routeRemaining: false, phase: "none", routed: 0 },
    {
      name: "unnumbered",
      routeRemaining: false,
      phase: "unnumbered",
      routed: 2,
    },
    { name: "nested", routeRemaining: false, phase: "numbered", routed: 1 },
    { name: "targeted", routeRemaining: false, phase: "targeted", routed: 1 },
    { name: "trace_phase", routeRemaining: false, phase: "trace", routed: 1 },
    { name: "breakout", routeRemaining: false, phase: "breakout", routed: 1 },
  ]) {
    const { circuit } = getTestFixture()
    let routedConnectionCount = 0
    const algorithmFn = createBasicAutorouter(async (input) => {
      routedConnectionCount += input.connections.length
      return input.connections.map((connection) => ({
        type: "pcb_trace" as const,
        pcb_trace_id: `${connection.name}_routed`,
        connection_name: connection.source_trace_id ?? connection.name,
        route: connection.pointsToConnect.map((point) => ({
          route_type: "wire" as const,
          x: point.x,
          y: point.y,
          width: 0.15,
          layer: point.layer,
        })),
      }))
    })
    const components = (
      <>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-3}
          pcbY={2}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={3}
          pcbY={2}
        />
        <resistor
          name="R3"
          resistance="1k"
          footprint="0402"
          pcbX={-3}
          pcbY={-2}
        />
        <resistor
          name="R4"
          resistance="1k"
          footprint="0402"
          pcbX={3}
          pcbY={-2}
        />
        {scenario.phase === "numbered" && (
          <autoroutingphase phaseIndex={0} connection="R1.pin2" />
        )}
        {scenario.phase === "unnumbered" && <autoroutingphase />}
        {scenario.phase === "targeted" && (
          <autoroutingphase connection="R1.pin2" />
        )}
        {scenario.phase === "breakout" ? (
          <breakout
            name="fanout"
            autorouter={{ local: true, groupMode: "subcircuit", algorithmFn }}
          >
            <trace from=".R1 > .pin2" to=".R2 > .pin1" />
          </breakout>
        ) : (
          <trace
            from=".R1 > .pin2"
            to=".R2 > .pin1"
            routingPhaseIndex={scenario.phase === "trace" ? 0 : undefined}
          />
        )}
        <trace from=".R3 > .pin2" to=".R4 > .pin1" />
      </>
    )
    circuit.add(
      <board
        width={12}
        height={10}
        routeRemaining={scenario.routeRemaining}
        autorouter={{ local: true, groupMode: "subcircuit", algorithmFn }}
      >
        {scenario.name === "nested" ? (
          <group name="child" subcircuit>
            {components}
          </group>
        ) : (
          components
        )}
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(routedConnectionCount).toBe(scenario.routed)
    expect(circuit.db.pcb_trace.list()).toHaveLength(scenario.routed)
    const errors = circuit.db.pcb_port_not_connected_error.list()
    expect(errors).toHaveLength(2 - scenario.routed)
    if (scenario.routed === 1) {
      expect(errors[0].message).toContain("R3.pin2")
      expect(errors[0].message).toContain("R4.pin1")
    }
    const errorMessages = circuit
      .getCircuitJson()
      .filter(
        (element) => element.type.endsWith("_error") && "message" in element,
      )
      .map((element) => (element as { message: string }).message)
    const escapeXml = (text: string) =>
      text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
    const errorLines = errorMessages.flatMap(
      (message) => message.match(/.{1,88}(?:\s|$)|.{1,88}/g) ?? [],
    )
    const diagnostics = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="140" viewBox="0 0 800 140">
      <rect width="800" height="140" fill="#172131" />
      <text x="20" y="27" fill="${errorMessages.length ? "#ff9999" : "#86efac"}" font-family="Arial, sans-serif" font-size="19" font-weight="bold">${errorMessages.length ? `${errorMessages.length} DRC diagnostics` : "No DRC errors"}</text>
      ${errorLines.map((line, index) => `<text x="20" y="${52 + index * 20}" fill="#ffb4b4" font-family="Arial, sans-serif" font-size="17">${escapeXml(line.trim())}</text>`).join("")}
    </svg>`
    const status = `${circuit.db.pcb_trace.list().length} routed connection(s) | ${errors.length} unconnected-port DRC error(s)`
    const label = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="100" viewBox="0 0 800 100">
      <rect width="800" height="100" fill="#172131" />
      <text x="20" y="30" fill="white" font-family="Arial, sans-serif" font-size="23" font-weight="bold">${descriptions[scenario.name]}</text>
      <text x="20" y="59" fill="${errors.length ? "#ff9999" : "#86efac"}" font-family="Arial, sans-serif" font-size="19">${status}</text>
      <text x="20" y="85" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="16">Red copper: routed. White lines: connectivity. Actual DRC messages below.</text>
    </svg>`
    panels.push(
      stackSvgsVertically(
        [
          label,
          convertCircuitJsonToPcbSvg(circuit.getCircuitJson(), {
            width: 800,
            height: 480,
            shouldDrawErrors: true,
            showErrorsInTextOverlay: false,
            shouldDrawRatsNest: true,
            showPinNumbers: true,
          }),
          diagnostics,
        ],
        { gap: 0, normalizeSize: false },
      ),
    )
  }
  const rows = []
  for (let index = 0; index < panels.length; index += 3) {
    rows.push(
      stackSvgsHorizontally(panels.slice(index, index + 3), {
        gap: 16,
        normalizeSize: false,
      }),
    )
  }
  await expect(
    stackSvgsVertically(rows, { gap: 16, normalizeSize: false }),
  ).toMatchSvgSnapshot(import.meta.path, "board-route-remaining-grid", {
    diffThresholdPercent: 0,
  })
})
