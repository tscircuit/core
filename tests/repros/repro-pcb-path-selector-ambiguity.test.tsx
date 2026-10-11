import { expect, test } from "bun:test"
import { RootCircuit, type Group, type Port } from "lib"
import { getAutoroutingPhasePcbTracePaths } from "lib/components/primitive-components/Group/get-autorouting-phase-pcb-trace-paths"

test.failing("saved-path port uniqueness", async () => {
  const circuit = new RootCircuit()
  circuit.add(
    <board routingDisabled schematicDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} />
    </board>,
  )
  await circuit.renderUntilSettled()
  const board = circuit.firstChild as Group
  const ports = board.selectAll<Port>("resistor port.pin2")
  expect(ports).toHaveLength(2)
  const counts = ports.flatMap((port) => {
    const { x, y } = circuit.db.pcb_port.get(port.pcb_port_id!)!
    return [
      "resistor port.pin2",
      ".missing port.pin2",
      "R1.pin2",
      "R2.pin2",
      "resistor, .R1 > port.pin2",
    ].map((selector) => {
      const result = getAutoroutingPhasePcbTracePaths({
        group: board,
        subcircuit: board,
        isFanout: true,
        input: {
          layerCount: 2,
          minTraceWidth: 0.2,
          obstacles: [],
          bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
          connections: [
            {
              name: "escape",
              pointsToConnect: [
                {
                  x,
                  y,
                  layer: "top",
                  pcb_port_id: port.pcb_port_id!,
                  port_selector: selector,
                },
              ],
            },
          ],
        },
        traces: [
          {
            type: "pcb_trace",
            pcb_trace_id: "escape",
            route: [0, 1].map((dx) => ({
              route_type: "wire" as const,
              x: x + dx,
              y,
              layer: "top",
              width: 0.2,
            })),
          },
        ],
      })
      return result.pcbTracePaths?.length ?? 0
    })
  })
  expect(counts).toEqual([0, 0, 1, 0, 1, 0, 0, 0, 1, 0])
})
