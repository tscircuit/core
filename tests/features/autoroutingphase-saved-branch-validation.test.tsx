import { expect, test } from "bun:test"
import { fanoutTracePath } from "@tscircuit/props"
import type { AutoroutingStartEvent } from "lib/events"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { getSavedAutoroutingPhaseTracesFromPaths } from "lib/components/primitive-components/Group/get-saved-autorouting-phase-traces"
import { getSavedRouteBranchesFixture } from "tests/fixtures/get-saved-route-branches-fixture"

test("saved branch connectivity rejects gaps, wrong layers, islands, and foreign nets", async () => {
  const { circuit, events } = getSavedRouteBranchesFixture({ kind: "junction" })
  let start: AutoroutingStartEvent | undefined
  circuit.on("autorouting:start", (event) => {
    start = event
  })
  await circuit.renderUntilSettled()
  expect(events[0]!.pcbTracePathsUnavailableReason).toBeUndefined()
  const paths = events[0]!.pcbTracePaths!.map((path) =>
    fanoutTracePath.parse(path),
  )
  const group = circuit.firstChild as Group
  const input = start!.simpleRouteJson
  const original = JSON.stringify({ input, paths })
  const replay = (candidatePaths: typeof paths, candidateInput = input) =>
    getSavedAutoroutingPhaseTracesFromPaths({
      group,
      subcircuit: group,
      paths: candidatePaths,
      input: candidateInput,
      isFanout: false,
    })
  // Junction resolution is independent of path order and does not mutate inputs.
  expect(replay([...paths].reverse()).traces).toHaveLength(4)
  expect(JSON.stringify({ input, paths })).toBe(original)

  const gap = structuredClone(paths)
  gap[3]!.route[0]!.y = 0.01
  expect(() => replay(gap)).toThrow("must start at its PCB port")
  const wrongLayer = structuredClone(paths)
  wrongLayer[3]!.route = wrongLayer[3]!.route.map((point) => ({
    ...point,
    layer: "bottom",
  }))
  expect(() => replay(wrongLayer)).toThrow("must start at its PCB port")
  const island = structuredClone(paths)
  island.push({
    connection: paths[0]!.connection,
    route: [
      { route_type: "wire", x: -2, y: -2, width: 0.25, layer: "top" },
      { route_type: "wire", x: 2, y: -2, width: 0.25, layer: "top" },
    ],
  })
  expect(() => replay(island)).toThrow("must start at its PCB port")
  expect(() => replay(paths.slice(0, 3))).toThrow("must connect every endpoint")

  // Same physical contact is a short when the requested net identities differ.
  const foreignInput = structuredClone(input)
  const c = foreignInput.connections
    .flatMap((connection) => connection.pointsToConnect)
    .find((point) => point.y === 4)!
  foreignInput.connections = [
    {
      name: "signal",
      pointsToConnect: foreignInput.connections[0]!.pointsToConnect.filter(
        (point) => point.y === 0,
      ),
    },
    { name: "other_signal", pointsToConnect: [c] },
  ]
  expect(() => replay(paths, foreignInput)).toThrow("different net")

  const viaBranch = structuredClone(paths)
  viaBranch[3] = fanoutTracePath.parse({
    connection: paths[3]!.connection,
    route: [
      { route_type: "via", x: 0, y: 0, from_layer: "top", to_layer: "bottom" },
      { route_type: "wire", x: 0, y: 3, layer: "bottom", width: 0.25 },
      { route_type: "via", x: 0, y: 3, from_layer: "bottom", to_layer: "top" },
      { route_type: "wire", x: 0, y: 4, layer: "top", width: 0.25 },
    ],
  })
  expect(
    replay(viaBranch).traces[3]!.route.filter(
      (point) => point.route_type === "via",
    ),
  ).toHaveLength(2)
  // A top-to-inner1 through via reaches a bottom trunk; a blind via does not.
  const multilayer = structuredClone(viaBranch)
  multilayer[1]!.route = [
    { route_type: "via", x: -1, y: 0, from_layer: "top", to_layer: "bottom" },
    { route_type: "wire", x: 1, y: 0, width: 0.25, layer: "bottom" },
    { route_type: "via", x: 1, y: 0, from_layer: "bottom", to_layer: "top" },
  ]
  multilayer[3]!.route = [
    { route_type: "via", x: 0, y: 0, from_layer: "top", to_layer: "inner1" },
    { route_type: "wire", x: 0, y: 3, width: 0.25, layer: "inner1" },
    { route_type: "via", x: 0, y: 3, from_layer: "inner1", to_layer: "top" },
    { route_type: "wire", x: 0, y: 4, width: 0.25, layer: "top" },
  ]
  expect(replay(multilayer, { ...input, layerCount: 4 }).traces).toHaveLength(4)
  expect(() =>
    replay(multilayer, {
      ...input,
      layerCount: 4,
      allowBlindAndBuriedVias: true,
    }),
  ).toThrow("must start at its PCB port")
  const loop = structuredClone(paths)
  loop.push({
    connection: paths[0]!.connection,
    route: [
      { route_type: "wire", x: 0, y: 0, width: 0.25, layer: "top" },
      { route_type: "wire", x: 1, y: 1, width: 0.25, layer: "top" },
      { route_type: "wire", x: -1, y: 1, width: 0.25, layer: "top" },
      { route_type: "wire", x: 0, y: 0, width: 0.25, layer: "top" },
    ],
  })
  expect(replay(loop).traces).toHaveLength(5)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
