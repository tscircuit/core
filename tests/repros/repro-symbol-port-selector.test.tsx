import { expect, test } from "bun:test"
import { RootCircuit, getSimpleRouteJsonFromCircuitJson } from "lib"
import type { Group, Port } from "lib"
import { getAutoroutingPhasePcbTracePaths } from "lib/components/primitive-components/Group/get-autorouting-phase-pcb-trace-paths"
import { captureSelectorSnapshot } from "./repro-symbol-port-selector-snapshot"

test.failing(
  "custom Symbol port selector selects its original port and exports its saved path",
  async () => {
    const circuit = new RootCircuit()
    circuit.add(
      <board width={10} height={5} routingDisabled schematicDisabled>
        <chip
          name="Q_PD_INHIBIT"
          pcbX={-2}
          pinLabels={{ pin2: "pin2" }}
          footprint={
            <footprint>
              <smtpad portHints={["pin2"]} width={1} height={1} shape="rect" />
            </footprint>
          }
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
          footprint={
            <footprint>
              <smtpad portHints={["pin2"]} width={1} height={1} shape="rect" />
            </footprint>
          }
        >
          <port name="pin2" pinNumber={2} />
        </chip>
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
    // Pending SRJ connections and routed copper come from this same live render.
    const { simpleRouteJson: input } = getSimpleRouteJsonFromCircuitJson({
      circuitJson: circuitJson.filter(
        (element) => element.type !== "pcb_trace",
      ),
    })
    const [trace] = getSimpleRouteJsonFromCircuitJson({ circuitJson })
      .simpleRouteJson.traces!
    expect(trace).toBeDefined()
    const port = board.selectOne<Port>("Q_PD_INHIBIT.pin2", {
      type: "port",
    })!
    const selector = port.getPortSelector()
    for (const connection of input.connections) {
      for (const point of connection.pointsToConnect) {
        if (point.pcb_port_id === port.pcb_port_id)
          point.port_selector = undefined
      }
    }
    const result = getAutoroutingPhasePcbTracePaths({
      group: board,
      subcircuit: board,
      input,
      isFanout: false,
      traces: [trace!],
    })
    const output = {
      portMatches: board
        .selectAll(selector)
        .filter((port) => port.lowercaseComponentName === "port").length,
      originalPort: board.selectOne(selector, { type: "port" }) === port,
      savedPaths: result.pcbTracePaths?.length ?? 0,
    }
    const expected = {
      portMatches: 1,
      originalPort: true,
      savedPaths: 1,
    }
    await captureSelectorSnapshot(
      "repro-symbol-port-selector",
      "Symbol port selectors must anchor their own saved paths.",
      circuitJson,
      output,
      expected,
    )
    expect(output).toEqual(expected)
  },
)
