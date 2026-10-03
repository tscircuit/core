import { expect, test } from "bun:test"
import type { IGroup } from "lib/components/primitive-components/Group/IGroup"
import type { ISubcircuit } from "lib/components/primitive-components/Group/Subcircuit/ISubcircuit"
import { getAutoroutingPhasePcbTracePaths } from "lib/components/primitive-components/Group/get-autorouting-phase-pcb-trace-paths"
import { getSavedAutoroutingPhaseTracesFromPaths } from "lib/components/primitive-components/Group/get-saved-autorouting-phase-traces"
import type { Port } from "lib/components/primitive-components/Port"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("repro106: branched and shared routes replay each copper segment once", () => {
  // First observed on SparkFun's CD74HC4067 mux breakout. Before this graph
  // export fix, the board routed successfully but its branched paths were not saved.
  const terminals = [
    { name: "A", x: -2, y: 0, layers: ["top"] },
    { name: "B", x: 0, y: -2, layers: ["top"] },
    { name: "C", x: 6, y: 0, layers: ["top", "bottom"] },
    { name: "D", x: 4, y: 2, layers: ["top"] },
  ].map(({ name, x, y, layers }) => {
    const port = {
      pcb_port_id: `pcb_port_${name}`,
      root: {
        db: {
          pcb_port: {
            get: () => ({ x, y, layers }),
          },
        },
      },
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
        pointId: port.pcb_port_id,
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
    layer: "top" | "bottom" = "top",
  ) => ({
    route_type: "wire" as const,
    x,
    y,
    width: 0.2,
    layer,
    ...(pcbPortId
      ? endpoint === "start"
        ? { start_pcb_port_id: pcbPortId }
        : { end_pcb_port_id: pcbPortId }
      : {}),
  })
  const [a, b, c, d] = terminals
  const traces = [
    {
      connection_name: "shared_net",
      route: [
        wirePoint(a!.terminal.x, a!.terminal.y, "start", a!.port.pcb_port_id),
        wirePoint(0, 0, "end"),
      ],
    },
    {
      connection_name: "shared_net",
      route: [
        wirePoint(b!.terminal.x, b!.terminal.y, "start", b!.port.pcb_port_id),
        wirePoint(0, 0, "end"),
      ],
    },
    {
      connection_name: undefined,
      route: [wirePoint(0, 0, "start"), wirePoint(4, 0, "end")],
    },
    {
      connection_name: "shared_net",
      route: [
        wirePoint(4, 0, "start"),
        {
          route_type: "via" as const,
          x: 5,
          y: 0,
          from_layer: "top" as const,
          to_layer: "bottom" as const,
        },
        wirePoint(
          c!.terminal.x,
          c!.terminal.y,
          "end",
          c!.port.pcb_port_id,
          "bottom",
        ),
      ],
    },
    {
      connection_name: "shared_net",
      route: [
        wirePoint(4, 0, "start"),
        wirePoint(d!.terminal.x, d!.terminal.y, "end", d!.port.pcb_port_id),
      ],
    },
  ]

  const input = {
    layerCount: 2,
    minTraceWidth: 0.2,
    allowViaInPad: false,
    connections: [
      {
        name: "shared_net",
        source_trace_id: "source_trace_shared",
        pointsToConnect: terminals.map(({ terminal }) => terminal),
      },
      {
        name: "duplicate_AC",
        source_trace_id: "source_trace_duplicate",
        pointsToConnect: [a!.terminal, c!.terminal],
      },
    ],
  } as unknown as SimpleRouteJson
  const result = getAutoroutingPhasePcbTracePaths({
    group,
    subcircuit,
    input,
    traces: traces as Parameters<
      typeof getAutoroutingPhasePcbTracePaths
    >[0]["traces"],
    isFanout: false,
  })

  expect(result.pcbTracePathsUnavailableReason).toBeUndefined()
  expect(result.pcbTracePaths).toHaveLength(5)
  expect(result.pcbTracePaths?.map((path) => path.connection)).toEqual([
    "shared_net",
    "shared_net",
    "shared_net",
    "shared_net",
    "shared_net",
  ])
  const replay = getSavedAutoroutingPhaseTracesFromPaths({
    group,
    subcircuit,
    paths: result.pcbTracePaths!,
    input,
    isFanout: false,
  })
  expect(replay.traces).toHaveLength(traces.length)
  const geometry = (
    route: readonly {
      route_type: string
      x?: number
      y?: number
      layer?: string
      width?: number
    }[],
  ) =>
    route
      .filter(
        (point) =>
          point.route_type === "via" ||
          !route.some(
            (via) =>
              via.route_type === "via" &&
              via.x === point.x &&
              via.y === point.y,
          ),
      )
      .map(({ route_type, x, y, layer, width }) => ({
        route_type,
        x,
        y,
        layer,
        width,
      }))
  expect(replay.traces.map((trace) => geometry(trace.route))).toEqual(
    traces.map((trace) => geometry(trace.route)),
  )
  expect(replay.traces[0]?.connectsTo).toContain("source_trace_duplicate")
  expect(replay.traces[0]?.connectsTo).not.toContain("pcb_port_C")
  expect(replay.traces[3]?.connectsTo).toContain("pcb_port_C")
  expect(replay.traces[3]?.connectsTo).not.toContain("pcb_port_B")

  expect(() =>
    getSavedAutoroutingPhaseTracesFromPaths({
      group,
      subcircuit,
      paths: [
        ...result.pcbTracePaths!,
        {
          connection: "shared_net",
          route: [wirePoint(20, 20, "start"), wirePoint(21, 20, "end")],
        },
      ],
      input,
      isFanout: false,
    }),
  ).toThrow("disconnected segments")
})
