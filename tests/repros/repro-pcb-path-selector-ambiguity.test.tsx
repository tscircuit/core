import { expect, test } from "bun:test"
import { RootCircuit, type Port, type Group, type SimpleRouteJson } from "lib"
import { getAutoroutingPhasePcbTracePaths } from "lib/components/primitive-components/Group/get-autorouting-phase-pcb-trace-paths"

test("saved paths reject ambiguous selectors, including the first matching port", async () => {
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
    rejected.push(result.pcbTracePaths === undefined)
    expect(result.pcbTracePathsUnavailableReason).toContain("matched 2")
    for (const [selector, owner] of [
      [".missing port.pin2", undefined],
      ["R1.pin2", "R1"],
      ["R2.pin2", "R2"],
      ["resistor, .R1 > port.pin2", "R1"],
    ] as const) {
      const controlInput = structuredClone(input)
      controlInput.connections[0]!.pointsToConnect[0]!.port_selector = selector
      const control = getAutoroutingPhasePcbTracePaths({
        group: board,
        subcircuit: board,
        input: controlInput,
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
      // Expected ownership follows the named fixture, not the generated selector.
      const isOriginal = owner === port.getParentNormalComponent()!.props.name
      expect(control.pcbTracePaths?.length ?? 0).toBe(isOriginal ? 1 : 0)
      if (!isOriginal) {
        expect(control.pcbTracePathsUnavailableReason).toContain(
          selector.startsWith(".missing") ? "matched 0" : "matched 1",
        )
      }
    }
  }
  expect(rejected).toEqual([true, true])
})
