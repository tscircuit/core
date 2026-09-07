import { expect, test } from "bun:test"
import { convertSrjToGraphicsObject } from "@tscircuit/capacity-autorouter"
import { FanoutSolver } from "@tscircuit/fanout-solver"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { FanoutAutorouter } from "lib/utils/autorouting/FanoutAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import frozenInput from "tests/fixtures/allwinner-t113-plane-fanout/usb-uart.srj.json"

// Frozen pad points in right-handed board-world space (mm, +X right, +Y up,
// +Z above). Copper layers top -> inner1 -> inner2 -> bottom descend along Z.
const input = frozenInput as SimpleRouteJson

test("Allwinner USB UART plane fanout matches a direct replay of the core constructor arguments", async () => {
  let solverConstructorArgs:
    | ReturnType<FanoutSolver["getConstructorParams"]>
    | undefined
  const autorouter = new FanoutAutorouter(structuredClone(input), {
    mode: "fanout",
    onSolverStarted: (details) => {
      solverConstructorArgs = structuredClone(details.solverConstructorArgs)
    },
  })
  const traces = autorouter.solveSync()
  expect(solverConstructorArgs).toBeDefined()
  const [solverInput, solverOptions] = solverConstructorArgs!
  expect<unknown>(solverInput).toEqual(input)
  expect(solverOptions.buses).toEqual(input.buses)
  expect(solverOptions.allowSameNetMerges).toBe(true)
  expect(solverOptions.allowBlindAndBuriedVias).toBe(false)

  const directSolver = new FanoutSolver(
    structuredClone(solverInput),
    structuredClone(solverOptions),
  )
  directSolver.solve()
  expect(directSolver.solved).toBe(true)
  expect(traces).toEqual(directSolver.getOutput().fanoutTraces)
  expect(traces).toHaveLength(input.connections.length)
  expect(autorouter.getOutputSimpleRouteJson()?.connections).toEqual([])

  // This control makes the regression sensitive to the integration policy,
  // rather than only comparing two equally incomplete routing attempts.
  const isolatedSolver = new FanoutSolver(structuredClone(solverInput), {
    ...solverOptions,
    allowSameNetMerges: false,
  })
  isolatedSolver.solve()
  expect(isolatedSolver.failed).toBe(true)
  expect(isolatedSolver.stats.routedConnections).toBe("10/11")

  for (const bus of input.buses!) {
    const trace = traces.find(
      (trace) => trace.connection_name === bus.connectionNames[0],
    )!
    const vias = trace.route.filter((point) => point.route_type === "via")
    expect(vias).toHaveLength(1)
    expect(vias[0]).toMatchObject({
      to_layer: bus.termination!.type === "plane" && bus.termination!.layer,
      layers: ["top", "inner1", "inner2", "bottom"],
      via_diameter: 0.6,
      via_hole_diameter: 0.3,
    })
  }

  await expect(
    getSvgFromGraphicsObject(
      {
        ...convertSrjToGraphicsObject({
          ...solverInput,
          connections: [],
          traces: directSolver.getOutput().fanoutTraces,
        }),
        texts: [
          {
            x: -45,
            y: 40,
            text: "Allwinner T113-S3 USB UART: 11 GND / V3V3 plane drops",
            fontSize: 0.35,
            color: "#111",
            anchorSide: "center",
          },
        ],
      },
      { svgWidth: 800, svgHeight: 700, hideInlineLabels: true },
    ),
  ).toMatchSvgSnapshot(import.meta.path)
})
