import { expect, test } from "bun:test"
import { RootCircuit, type Port, type Group, type SimpleRouteJson } from "lib"
import { getAutoroutingPhasePcbTracePaths } from "lib/components/primitive-components/Group/get-autorouting-phase-pcb-trace-paths"

const regression = process.env.ASSERT_PORT_SELECTOR_CONTRACT
  ? test
  : test.failing

regression(
  "saved paths reject ambiguous selectors, including the first matching port",
  async () => {
    const circuit = new RootCircuit()
    circuit.add(
      <board width={10} height={10} routingDisabled schematicDisabled>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} />
      </board>,
    )
    await circuit.renderUntilSettled()
    const board = circuit.firstChild as Group
    const ports = board.selectAll<Port>("resistor port.pin2")
    expect(ports).toHaveLength(2)
    const rejected: boolean[] = []
    for (const port of ports) {
      const pcbPort = circuit.db.pcb_port.get(port.pcb_port_id!)!
      const input: SimpleRouteJson = {
        layerCount: 2,
        minTraceWidth: 0.2,
        bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
        obstacles: [],
        connections: [
          {
            name: "escape",
            pointsToConnect: [
              {
                x: pcbPort.x,
                y: pcbPort.y,
                layer: "top",
                pcb_port_id: port.pcb_port_id!,
                port_selector: "resistor port.pin2",
              },
            ],
          },
        ],
      }
      const result = getAutoroutingPhasePcbTracePaths({
        group: board,
        subcircuit: board,
        input,
        isFanout: true,
        traces: [
          {
            type: "pcb_trace",
            pcb_trace_id: "escape",
            route: [0, 1].map((dx) => ({
              route_type: "wire" as const,
              x: pcbPort.x + dx,
              y: pcbPort.y,
              layer: "top",
              width: 0.2,
            })),
          },
        ],
      })
      rejected.push(
        result.pcbTracePaths === undefined &&
          !!result.pcbTracePathsUnavailableReason,
      )
    }
    expect(rejected).toEqual([true, true])
  },
)
