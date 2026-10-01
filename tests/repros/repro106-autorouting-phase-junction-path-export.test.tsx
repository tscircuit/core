import { expect, test } from "bun:test"
import type { IGroup } from "lib/components/primitive-components/Group/IGroup"
import type { ISubcircuit } from "lib/components/primitive-components/Group/Subcircuit/ISubcircuit"
import { getAutoroutingPhasePcbTracePaths } from "lib/components/primitive-components/Group/get-autorouting-phase-pcb-trace-paths"
import type { Port } from "lib/components/primitive-components/Port"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("repro106: routed branch-to-branch segment cannot be exported as a port path", () => {
  // First observed on SparkFun's CD74HC4067 mux breakout. The normal board build
  // successfully routes, but core cannot save replayable phase paths for it.
  const terminals = [
    { name: "A", x: -2, y: 0 },
    { name: "B", x: 0, y: -2 },
    { name: "C", x: 6, y: 0 },
    { name: "D", x: 4, y: 2 },
  ].map(({ name, x, y }) => {
    const port = {
      pcb_port_id: `pcb_port_${name}`,
      getPortSelector: () => `.U1 > port.${name}`,
      _getGlobalPcbPositionBeforeLayout: () => ({ x, y }),
      _getGlobalPcbPositionAfterLayout: () => ({ x, y }),
    } as unknown as Port

    return {
      name,
      port,
      terminal: {
        x,
        y,
        layer: "top",
        pcb_port_id: port.pcb_port_id,
        port_selector: `.U1 > port.${name}`,
      },
    }
  })

  const ports = terminals.map(({ port }) => port)
  const subcircuit = {
    selectAll: () => ports,
    selectOne: (selector: string) =>
      ports.find((port) => port.getPortSelector() === selector),
  } as unknown as Pick<ISubcircuit, "selectOne" | "selectAll">
  const group = {
    pcb_group_id: null,
    _computePcbGlobalTransformBeforeLayout: () => ({
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: 0,
      f: 0,
    }),
  } as unknown as Pick<
    IGroup,
    "pcb_group_id" | "_computePcbGlobalTransformBeforeLayout"
  >

  const wirePoint = (
    x: number,
    y: number,
    endpoint: "start" | "end",
    pcbPortId?: string | null,
  ) => ({
    route_type: "wire" as const,
    x,
    y,
    width: 0.2,
    layer: "top" as const,
    ...(pcbPortId
      ? endpoint === "start"
        ? { start_pcb_port_id: pcbPortId }
        : { end_pcb_port_id: pcbPortId }
      : {}),
  })
  const [a, b, c, d] = terminals
  const traces = [
    {
      route: [
        wirePoint(a!.terminal.x, a!.terminal.y, "start", a!.port.pcb_port_id),
        wirePoint(0, 0, "end"),
      ],
    },
    {
      route: [
        wirePoint(b!.terminal.x, b!.terminal.y, "start", b!.port.pcb_port_id),
        wirePoint(0, 0, "end"),
      ],
    },
    { route: [wirePoint(0, 0, "start"), wirePoint(4, 0, "end")] },
    {
      route: [
        wirePoint(4, 0, "start"),
        wirePoint(c!.terminal.x, c!.terminal.y, "end", c!.port.pcb_port_id),
      ],
    },
    {
      route: [
        wirePoint(4, 0, "start"),
        wirePoint(d!.terminal.x, d!.terminal.y, "end", d!.port.pcb_port_id),
      ],
    },
  ]

  const result = getAutoroutingPhasePcbTracePaths({
    group,
    subcircuit,
    input: {
      connections: [
        {
          name: "shared_net",
          pointsToConnect: terminals.map(({ terminal }) => terminal),
        },
      ],
    } as unknown as SimpleRouteJson,
    traces: traces as Parameters<
      typeof getAutoroutingPhasePcbTracePaths
    >[0]["traces"],
    isFanout: false,
  })

  expect(result.pcbTracePaths).toBeUndefined()
  expect(result.pcbTracePathsUnavailableReason).toBe(
    "Routes contain a junction or endpoint that cannot select a unique PCB port",
  )
})
