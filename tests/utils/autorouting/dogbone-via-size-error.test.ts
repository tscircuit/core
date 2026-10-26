import { expect, test } from "bun:test"
import { getDogboneViaSizeError } from "lib/utils/autorouting/get-dogbone-via-size-error"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

const makeInput = (rotation = 0): SimpleRouteJson => ({
  layerCount: 2,
  minTraceWidth: 0.15,
  minViaPadDiameter: 0.6,
  minTraceToPadEdgeClearance: 0.1,
  minViaEdgeToPadEdgeClearance: 0.1,
  bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
  obstacles: [-1, 0, 1].flatMap((x) =>
    [-1, 0, 1].map((y) => ({
      type: "rect" as const,
      shape: "circle" as const,
      componentId: "pcb_component_0",
      center: {
        x: 0.65 * (x * Math.cos(rotation) - y * Math.sin(rotation)),
        y: 0.65 * (x * Math.sin(rotation) + y * Math.cos(rotation)),
      },
      width: 0.4,
      height: 0.4,
      layers: ["top"],
      connectedTo: [`pad_${x}_${y}`],
      circuitJsonMetadata: {
        pcb_smtpad_id: `pad_${x}_${y}`,
        pcb_port_id: `port_${x}_${y}`,
        source_component_name: "U1",
        source_port_name: `ball_${x}_${y}`,
      },
    })),
  ),
  connections: [
    {
      name: "signal",
      pointsToConnect: [
        {
          x: 0,
          y: 0,
          layer: "top",
          pcb_port_id: "port_0_0",
          port_selector: "U1.A1",
        },
        { x: 3, y: 0, layer: "bottom" },
      ],
    },
  ],
})

test("dogbone precheck proves enclosure and honors routing geometry", () => {
  for (const rotation of [0, Math.PI / 2, Math.PI / 4, 0.37]) {
    const input = makeInput(rotation)
    expect(getDogboneViaSizeError(input)).toContain("dogboning U1.A1")
    expect(getDogboneViaSizeError(input)).toContain("0.319mm")
  }
  const safeInputs: SimpleRouteJson[] = [
    { ...makeInput(), minViaPadDiameter: 0.3 },
    { ...makeInput(), minViaPadDiameter: Math.SQRT2 * 0.65 - 0.4 - 0.2 },
    {
      ...makeInput(),
      minViaPadDiameter: 0.4,
      minViaEdgeToPadEdgeClearance: 0.01,
    },
    { ...makeInput(), allowViaInPad: true },
    { ...makeInput(), layerCount: 1 },
    { ...makeInput(), connections: [] },
    { ...makeInput(), minTraceWidth: 0.04, minTraceToPadEdgeClearance: 0.1 },
    { ...makeInput(), obstacles: makeInput().obstacles.slice(1) },
    {
      ...makeInput(),
      obstacles: makeInput().obstacles.map((pad) => ({
        ...pad,
        shape: undefined,
      })),
    },
    {
      ...makeInput(),
      traces: [{ type: "pcb_trace", pcb_trace_id: "existing", route: [] }],
    },
  ]
  for (const input of safeInputs)
    expect(getDogboneViaSizeError(input)).toBeNull()

  const explicitDogbone = makeInput()
  explicitDogbone.minTraceWidth = 0.04
  explicitDogbone.connections[0].pointsToConnect.pop()
  expect(getDogboneViaSizeError(explicitDogbone)).toBeNull()
  expect(
    getDogboneViaSizeError(explicitDogbone, { requiresDogbone: true }),
  ).toContain("this phase requires dogbone vias")

  const sameNetNeighbor = makeInput()
  sameNetNeighbor.obstacles[0].connectedTo.push("pad_0_0")
  expect(getDogboneViaSizeError(sameNetNeighbor)).toBeNull()

  const widerTrace = makeInput()
  widerTrace.minTraceWidth = 0.04
  widerTrace.connections[0].nominalTraceWidth = 0.15
  expect(getDogboneViaSizeError(widerTrace)).not.toBeNull()
})
