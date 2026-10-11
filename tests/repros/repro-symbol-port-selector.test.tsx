import { expect, test } from "bun:test"
import { RootCircuit, getSimpleRouteJsonFromCircuitJson } from "lib"
import type { Group, Port } from "lib"
import { getAutoroutingPhasePcbTracePaths } from "lib/components/primitive-components/Group/get-autorouting-phase-pcb-trace-paths"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

test.failing("symbol port selectors and saved paths", async () => {
  const circuit = new RootCircuit()
  const footprint = (
    <footprint>
      <smtpad portHints={["pin2"]} width={1} height={1} shape="rect" />
    </footprint>
  )
  circuit.add(
    <board width={10} height={5} routingDisabled schematicDisabled>
      <chip
        name="Q_PD_INHIBIT"
        pcbX={-2}
        pinLabels={{ pin2: "pin2" }}
        footprint={footprint}
        symbol={
          <symbol>
            <port name="pin2" pinNumber={2} />
          </symbol>
        }
      />
      <chip
        name="Q_OTHER"
        pcbX={2}
        pinLabels={{ pin2: "pin2" }}
        footprint={footprint}
      />
      <trace
        from="Q_PD_INHIBIT.pin2"
        to="Q_OTHER.pin2"
        pcbPath={["Q_PD_INHIBIT.pin2", "Q_OTHER.pin2"]}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const board = circuit.firstChild as Group
  const circuitJson = circuit.getCircuitJson()
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuitJson.filter((element) => element.type !== "pcb_trace"),
  })
  const ports = ["Q_PD_INHIBIT.pin2", "Q_OTHER.pin2"].map(
    (selector) => board.selectOne<Port>(selector, { type: "port" })!,
  )
  const [trace] = getSimpleRouteJsonFromCircuitJson({ circuitJson })
    .simpleRouteJson.traces!
  expect(trace).toBeDefined()
  const counts = ports.flatMap((port, i) =>
    [
      undefined,
      "chip port.pin2",
      ".missing port.pin2",
      "Q_PD_INHIBIT.pin2",
      "Q_OTHER.pin2",
      "chip, .Q_PD_INHIBIT port.pin2",
    ].map((selector) => {
      const input = structuredClone(simpleRouteJson)
      for (const point of input.connections.flatMap(
        (connection) => connection.pointsToConnect,
      )) {
        if (point.pcb_port_id === port.pcb_port_id)
          point.port_selector = selector
      }
      const result = getAutoroutingPhasePcbTracePaths({
        group: board,
        subcircuit: board,
        input,
        isFanout: false,
        traces: [
          {
            ...trace!,
            route: i === 0 ? trace!.route : trace!.route.toReversed(),
          },
        ],
      })
      return result.pcbTracePaths?.length ?? 0
    }),
  )
  const selector = ports[0]!.getPortSelector()
  const output = {
    matches: board.selectAll(selector).length,
    originalPort: board.selectOne(selector, { type: "port" }) === ports[0],
    counts,
  }
  const expected = {
    matches: 1,
    originalPort: true,
    counts: [1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0],
  }
  if (process.env.CAPTURE_SELECTOR_SNAPSHOT) {
    const pass = JSON.stringify(output) === JSON.stringify(expected)
    const svg = convertCircuitJsonToPcbSvg(circuitJson, {
      width: 800,
      height: 500,
      backgroundColor: "white",
      colorOverrides: { boardOutline: "#64748b" },
    }).replace(
      "</svg>",
      `<text x="400" y="30" text-anchor="middle" font-family="Arial" font-size="16" fill="#172033">tscircuit/core converts TSX circuits to Circuit JSON.</text><text x="400" y="55" text-anchor="middle" font-family="Arial" font-size="15" fill="${pass ? "#15803d" : "#b91c1c"}">${pass ? "PASS" : "FAIL"}: selector matches ${output.matches}; saved paths: ${counts[0]}; ambiguous exports: ${counts[1]! + counts[7]!}.</text></svg>`,
    )
    await Bun.write(
      new URL(
        `./__snapshots__/repro-symbol-port-selector-${pass ? "pass" : "failure"}.snap.svg`,
        import.meta.url,
      ),
      svg,
    )
  }
  expect(output).toEqual(expected)
})
