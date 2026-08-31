import { expect, test } from "bun:test"
import type {
  SimplifiedPcbTrace,
  SrjConnectionName,
} from "lib/utils/autorouting/SimpleRouteJson"
import {
  chamferOrthogonalTrace,
  getPlanarTraceLength,
  getTraceBundleClearanceViolations,
  postprocessOrthogonalTraceBundle,
} from "lib/utils/autorouting/postprocess-orthogonal-trace-bundle"

const createTrace = ({
  connectionName,
  points,
}: {
  connectionName: SrjConnectionName
  points: Array<{ x: number; y: number }>
}): SimplifiedPcbTrace => ({
  type: "pcb_trace",
  pcb_trace_id: `trace_${connectionName}`,
  connection_name: connectionName,
  route: points.map((point) => ({
    route_type: "wire",
    ...point,
    width: 0.1,
    layer: "top",
  })),
})

const createViaTrace = ({
  connectionName,
  x,
  y,
}: {
  connectionName: SrjConnectionName
  x: number
  y: number
}): SimplifiedPcbTrace => ({
  type: "pcb_trace",
  pcb_trace_id: `trace_${connectionName}`,
  connection_name: connectionName,
  route: [
    {
      route_type: "via",
      x,
      y,
      from_layer: "top",
      to_layer: "bottom",
      layers: ["top", "bottom"],
      via_diameter: 0.6,
      via_hole_diameter: 0.15,
    },
  ],
})

const renderTraceBundleSvg = (
  traces: readonly SimplifiedPcbTrace[],
  beforeSkew: number,
  afterSkew: number,
) => {
  const colors = ["#26d7ff", "#ff4fc8"]
  const toSvgPoint = (point: { x: number; y: number }) =>
    `${40 + point.x * 70},${390 - point.y * 55}`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="430" viewBox="0 0 720 430">
  <rect width="720" height="430" fill="#05070a"/>
  <text x="24" y="34" fill="#fff" font-family="monospace" font-size="18">45-degree bundle post-processing</text>
  <text x="24" y="58" fill="#a8b3c7" font-family="monospace" font-size="13">end-to-end skew ${beforeSkew.toFixed(3)}mm → ${afterSkew.toFixed(6)}mm</text>
  ${traces
    .map((trace, traceIndex) => {
      const points = trace.route.filter(
        (routePoint) => routePoint.route_type === "wire",
      )
      return `<polyline points="${points.map(toSvgPoint).join(" ")}" fill="none" stroke="${colors[traceIndex]}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>
  <text x="580" y="${110 + traceIndex * 26}" fill="${colors[traceIndex]}" font-family="monospace" font-size="14">${trace.connection_name}</text>`
    })
    .join("\n  ")}
</svg>`
}

test("post-processes an orthogonal bundle with 45-degree length-matched meanders", () => {
  const connectionA = "DATA_A" as SrjConnectionName
  const connectionB = "DATA_B" as SrjConnectionName
  const orthogonalTraces = [
    createTrace({
      connectionName: connectionA,
      points: [
        { x: 0, y: 0 },
        { x: 4.5, y: 0 },
        { x: 4.5, y: 3 },
        { x: 8, y: 3 },
      ],
    }),
    createTrace({
      connectionName: connectionB,
      points: [
        { x: 0, y: 2 },
        { x: 4, y: 2 },
        { x: 4, y: 5 },
        { x: 8, y: 5 },
      ],
    }),
  ]
  const fixedLengthByConnectionName = new Map<SrjConnectionName, number>([
    [connectionA, 0],
    [connectionB, 0.5],
  ])
  const beforeTotals = orthogonalTraces.map(
    (trace) =>
      getPlanarTraceLength(trace) +
      (fixedLengthByConnectionName.get(trace.connection_name!) ?? 0),
  )
  const beforeSkew = Math.max(...beforeTotals) - Math.min(...beforeTotals)

  const crossingTraces = [
    createTrace({
      connectionName: "CROSS_A",
      points: [
        { x: 0, y: 0 },
        { x: 6, y: 6 },
      ],
    }),
    createTrace({
      connectionName: "CROSS_B",
      points: [
        { x: 0, y: 6 },
        { x: 6, y: 0 },
      ],
    }),
  ]
  expect(
    getTraceBundleClearanceViolations({
      traces: crossingTraces,
      traceClearance: 0.1,
      viaClearance: 0.05,
    }).some((violation) => violation.code === "different_net_trace_clearance"),
  ).toBe(true)

  const wireToViaTrace: SimplifiedPcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "wire_to_via",
    connection_name: "WIRE_TO_VIA",
    route: [
      {
        route_type: "wire",
        x: 0,
        y: 0,
        width: 0.1,
        layer: "top",
      },
      {
        route_type: "via",
        x: 2,
        y: 0,
        from_layer: "top",
        to_layer: "bottom",
        via_diameter: 0.6,
        via_hole_diameter: 0.15,
      },
    ],
  }
  expect(getPlanarTraceLength(wireToViaTrace)).toBeCloseTo(2)
  expect(
    getTraceBundleClearanceViolations({
      traces: [
        wireToViaTrace,
        createTrace({
          connectionName: "WIRE_TO_VIA_CROSSING",
          points: [
            { x: 1, y: -1 },
            { x: 1, y: 1 },
          ],
        }),
      ],
      traceClearance: 0.1,
      viaClearance: 0.05,
    }).some((violation) => violation.code === "different_net_trace_clearance"),
  ).toBe(true)

  const variableWidthTrace: SimplifiedPcbTrace = {
    ...createTrace({
      connectionName: "WIDE_START",
      points: [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
      ],
    }),
    route: [
      {
        route_type: "wire",
        x: 0,
        y: 0,
        width: 0.5,
        layer: "top",
      },
      {
        route_type: "wire",
        x: 2,
        y: 0,
        width: 0.1,
        layer: "top",
      },
    ],
  }
  expect(
    getTraceBundleClearanceViolations({
      traces: [
        variableWidthTrace,
        createTrace({
          connectionName: "NEAR_WIDE_START",
          points: [
            { x: 0, y: 0.25 },
            { x: 2, y: 0.25 },
          ],
        }),
      ],
      traceClearance: 0,
      viaClearance: 0,
    }).some((violation) => violation.code === "different_net_trace_clearance"),
  ).toBe(true)

  const foldedBackTrace = createTrace({
    connectionName: "SELF_OVERLAP",
    points: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 0.04 },
      { x: 0, y: 0.04 },
    ],
  })
  expect(
    getTraceBundleClearanceViolations({
      traces: [foldedBackTrace],
      traceClearance: 0.1,
      viaClearance: 0.05,
    }).some((violation) => violation.code === "self_trace_clearance"),
  ).toBe(true)

  expect(
    getTraceBundleClearanceViolations({
      traces: [
        createTrace({
          connectionName: "VIA_CROSSING_TRACE",
          points: [
            { x: 0, y: 3 },
            { x: 6, y: 3 },
          ],
        }),
        createViaTrace({ connectionName: "VIA", x: 3, y: 3 }),
      ],
      traceClearance: 0.1,
      viaClearance: 0.05,
    }).some(
      (violation) => violation.code === "different_net_trace_via_clearance",
    ),
  ).toBe(true)

  const viaViolations = getTraceBundleClearanceViolations({
    traces: [
      createViaTrace({ connectionName: "VIA_A", x: 0, y: 0 }),
      createViaTrace({ connectionName: "VIA_B", x: 0.2, y: 0 }),
    ],
    traceClearance: 0.1,
    viaClearance: 0.05,
    bounds: { minX: -1, maxX: 0.4, minY: -1, maxY: 1 },
  })
  expect(
    viaViolations.some(
      (violation) => violation.code === "different_net_via_via_clearance",
    ),
  ).toBe(true)
  expect(
    viaViolations.some((violation) => violation.code === "outside_bounds"),
  ).toBe(true)

  const missingPadDiameterVia: SimplifiedPcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "missing_pad_diameter_via",
    connection_name: "MISSING_PAD_DIAMETER_VIA",
    route: [
      {
        route_type: "via",
        x: 0,
        y: 0,
        from_layer: "top",
        to_layer: "bottom",
        via_hole_diameter: 0.15,
      },
    ],
  }
  expect(() =>
    getTraceBundleClearanceViolations({
      traces: [missingPadDiameterVia],
      traceClearance: 0.1,
      viaClearance: 0.05,
    }),
  ).toThrow("pass viaDiameterFallback")
  expect(
    getTraceBundleClearanceViolations({
      traces: [missingPadDiameterVia],
      traceClearance: 0.1,
      viaClearance: 0.05,
      viaDiameterFallback: 0.6,
      bounds: { minX: -1, maxX: 0.2, minY: -1, maxY: 1 },
    }).some((violation) => violation.code === "outside_bounds"),
  ).toBe(true)

  const endpointTrace = createTrace({
    connectionName: connectionA,
    points: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
    ],
  })
  const endpointFanout = createTrace({
    connectionName: "FANOUT_ALIAS",
    points: [
      { x: -2, y: 0 },
      { x: 0, y: 0 },
    ],
  })
  const immutableConnectionNames = new Map([
    [endpointFanout.pcb_trace_id, connectionA],
  ])
  expect(
    getTraceBundleClearanceViolations({
      traces: [endpointTrace],
      immutableTraces: [endpointFanout],
      immutableTraceConnectionNameByPcbTraceId: immutableConnectionNames,
      traceClearance: 0.1,
      viaClearance: 0.05,
    }),
  ).toEqual([])

  const maximumReliefTrace = chamferOrthogonalTrace(
    createTrace({
      connectionName: "MAXIMUM_RELIEF",
      points: [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 3, y: 2 },
        { x: 6, y: 2 },
      ],
    }),
    10,
  )
  expect(
    maximumReliefTrace.route.map((point) => {
      if (point.route_type !== "wire") {
        throw new Error(
          "Maximum-relief trace unexpectedly contains non-wire geometry",
        )
      }
      return { x: point.x, y: point.y }
    }),
  ).toEqual([
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 1 },
    { x: 4, y: 2 },
    { x: 6, y: 2 },
  ])
  expect(
    postprocessOrthogonalTraceBundle({
      traces: [
        createTrace({
          connectionName: "NONCOLLINEAR_RELIEF",
          points: [
            { x: 0, y: 0 },
            { x: 2, y: 0 },
            { x: 2, y: 1 },
            { x: 0, y: 1 },
          ],
        }),
      ],
      chamfer: 10,
      traceClearance: 0.1,
      viaClearance: 0.05,
    }).clearanceViolations,
  ).toEqual([])
  expect(
    postprocessOrthogonalTraceBundle({
      traces: [
        createTrace({
          connectionName: "CASCADE_RELIEF",
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 1 },
            { x: 10.2, y: 1 },
            { x: 10.2, y: 11 },
          ],
        }),
      ],
      chamfer: 10,
      traceClearance: 0.1,
      viaClearance: 0.05,
    }).clearanceViolations,
  ).toEqual([])
  const overlappingFanout = createTrace({
    connectionName: "FANOUT_ALIAS",
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ],
  })
  expect(
    getTraceBundleClearanceViolations({
      traces: [endpointTrace],
      immutableTraces: [overlappingFanout],
      immutableTraceConnectionNameByPcbTraceId: immutableConnectionNames,
      traceClearance: 0.1,
      viaClearance: 0.05,
    }).some(
      (violation) => violation.code === "same_net_overlap_outside_endpoint",
    ),
  ).toBe(true)

  const internalJoinA = {
    ...createTrace({
      connectionName: "INTERNAL_JOIN",
      points: [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 2 },
      ],
    }),
    pcb_trace_id: "internal_join_a",
  }
  const internalJoinB = {
    ...createTrace({
      connectionName: "INTERNAL_JOIN",
      points: [
        { x: 1, y: -1 },
        { x: 2, y: 0 },
        { x: 3, y: -1 },
      ],
    }),
    pcb_trace_id: "internal_join_b",
  }
  expect(
    getTraceBundleClearanceViolations({
      traces: [internalJoinA, internalJoinB],
      traceClearance: 0.1,
      viaClearance: 0.05,
    }).some(
      (violation) => violation.code === "same_net_overlap_outside_endpoint",
    ),
  ).toBe(true)

  const internalViaWire = {
    ...createTrace({
      connectionName: "INTERNAL_VIA_JOIN",
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ],
    }),
    pcb_trace_id: "internal_via_wire",
  }
  const internalViaOther = {
    ...createViaTrace({
      connectionName: "INTERNAL_VIA_JOIN",
      x: 1,
      y: 0,
    }),
    pcb_trace_id: "internal_via_other",
  }
  expect(
    getTraceBundleClearanceViolations({
      traces: [internalViaWire, internalViaOther],
      traceClearance: 0.1,
      viaClearance: 0.05,
    }).some(
      (violation) => violation.code === "same_net_overlap_outside_endpoint",
    ),
  ).toBe(true)

  const routedViaTrace: SimplifiedPcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "routed_via_trace",
    connection_name: "ROUTED_VIA_TRACE",
    route: [
      {
        route_type: "wire",
        x: 0,
        y: 0,
        width: 0.1,
        layer: "top",
      },
      {
        route_type: "via",
        x: 1,
        y: 0,
        from_layer: "top",
        to_layer: "bottom",
        layers: ["top", "bottom"],
        via_diameter: 0.6,
        via_hole_diameter: 0.15,
      },
      {
        route_type: "wire",
        x: 1,
        y: 0,
        width: 0.1,
        layer: "bottom",
      },
      {
        route_type: "wire",
        x: 1,
        y: 1,
        width: 0.1,
        layer: "bottom",
      },
    ],
  }
  expect(
    getTraceBundleClearanceViolations({
      traces: [routedViaTrace],
      traceClearance: 0.1,
      viaClearance: 0.05,
    }),
  ).toEqual([])

  expect(() =>
    postprocessOrthogonalTraceBundle({
      traces: orthogonalTraces,
      lengthMatchGroups: [
        { connectionNames: [connectionA, connectionB], maxSkew: 0.001 },
        { connectionNames: [connectionB], maxSkew: 0.001 },
      ],
    }),
  ).toThrow("appears in more than one group")

  expect(() =>
    postprocessOrthogonalTraceBundle({
      traces: orthogonalTraces,
      maxMeanderAmplitude: 0,
    }),
  ).toThrow("maxMeanderAmplitude must be finite and positive")

  const result = postprocessOrthogonalTraceBundle({
    traces: orthogonalTraces,
    fixedLengthByConnectionName,
    lengthMatchGroups: [
      { connectionNames: [connectionA, connectionB], maxSkew: 0.001 },
    ],
    chamfer: 10,
    traceClearance: 0.1,
    viaClearance: 0.05,
    bounds: { minX: -1, maxX: 9, minY: -1, maxY: 7 },
  })

  expect(result.clearanceViolations).toEqual([])
  expect(
    result.traces.flatMap((trace) =>
      trace.route.filter((point) => point.route_type === "via"),
    ),
  ).toEqual([])
  expect(result.lengthMatchDiagnostics).toHaveLength(1)
  expect(
    result.lengthMatchDiagnostics[0]!.meanderToothCountByConnectionName.get(
      connectionA,
    ),
  ).toBeGreaterThan(0)
  const afterTotals = result.traces.map(
    (trace) =>
      getPlanarTraceLength(trace) +
      (fixedLengthByConnectionName.get(trace.connection_name!) ?? 0),
  )
  const afterSkew = Math.max(...afterTotals) - Math.min(...afterTotals)
  expect(afterSkew).toBeLessThanOrEqual(0.001)
  expect(
    result.traces.every((trace) =>
      trace.route.slice(1).every((routePoint, routePointIndex) => {
        const previous = trace.route[routePointIndex]!
        if (
          previous.route_type !== "wire" ||
          routePoint.route_type !== "wire"
        ) {
          return true
        }
        const deltaX = Math.abs(routePoint.x - previous.x)
        const deltaY = Math.abs(routePoint.y - previous.y)
        return (
          deltaX < 1e-6 || deltaY < 1e-6 || Math.abs(deltaX - deltaY) < 1e-6
        )
      }),
    ),
  ).toBe(true)
  expect(
    result.traces.every((trace) => {
      const vectors = trace.route.slice(1).flatMap((routePoint, index) => {
        const previous = trace.route[index]!
        if (
          previous.route_type !== "wire" ||
          routePoint.route_type !== "wire" ||
          previous.layer !== routePoint.layer
        ) {
          return []
        }
        const length = Math.hypot(
          routePoint.x - previous.x,
          routePoint.y - previous.y,
        )
        return length > 1e-9
          ? [
              {
                x: (routePoint.x - previous.x) / length,
                y: (routePoint.y - previous.y) / length,
              },
            ]
          : []
      })
      return vectors.slice(1).every((vector, index) => {
        const previous = vectors[index]!
        const dot = Math.max(
          -1,
          Math.min(1, previous.x * vector.x + previous.y * vector.y),
        )
        return (Math.acos(dot) * 180) / Math.PI <= 45.000001
      })
    }),
  ).toBe(true)

  expect(
    renderTraceBundleSvg(result.traces, beforeSkew, afterSkew),
  ).toMatchSvgSnapshot(import.meta.path, undefined, {
    diffThresholdPercent: 0,
  })
})
