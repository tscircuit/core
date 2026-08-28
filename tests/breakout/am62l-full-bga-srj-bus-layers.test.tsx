import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { Am62lLpddr4FullBgaBoard } from "tests/fixtures/am62l-lpddr4-full-bga/full-bga-board"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("both BGA SRJs receive the same immutable whole-bus layers before routing", async () => {
  const fanoutInputs: SimpleRouteJson[] = []
  const captureFanoutInput = createBasicAutorouter(async (input) => {
    fanoutInputs.push(structuredClone(input))
    return []
  })
  const noChannelRouting = createBasicAutorouter(async () => [])
  const { circuit } = getTestFixture()
  circuit.add(
    <Am62lLpddr4FullBgaBoard
      fanoutAlgorithmFn={captureFanoutInput}
      channelAlgorithmFn={noChannelRouting}
    />,
  )

  await circuit.renderUntilSettled()

  expect(fanoutInputs).toHaveLength(2)
  const summaries = fanoutInputs.map((input) =>
    input.buses
      ?.filter((bus) => bus.termination?.type !== "plane")
      .map((bus) => {
        const connections = input.connections.filter((connection) =>
          bus.connectionNames.includes(connection.name),
        )
        return {
          busId: bus.busId,
          preferredLayer: bus.preferredLayer,
          connectionCount: connections.length,
          targetLayerCount: connections.filter((connection) =>
            connection.pointsToConnect.some(
              (point) => point.layer === bus.preferredLayer,
            ),
          ).length,
          targetWindingIds: [...connections]
            .sort((first, second) => {
              const firstTarget = first.pointsToConnect.find(
                (point) => point.layer === bus.preferredLayer,
              )!
              const secondTarget = second.pointsToConnect.find(
                (point) => point.layer === bus.preferredLayer,
              )!
              return (
                firstTarget.y - secondTarget.y ||
                firstTarget.x - secondTarget.x ||
                first.name.localeCompare(second.name)
              )
            })
            .map(
              (connection) => connection.source_trace_id ?? connection.name,
            ),
          terminalLayerSets: connections.map((connection) => [
            ...new Set(
              connection.pointsToConnect.map((point) => point.layer),
            ),
          ]),
        }
      }),
  )
  expect(summaries[0]).toEqual([
    {
      busId: "DDR_BYTE0",
      preferredLayer: "inner2",
      connectionCount: 11,
      targetLayerCount: 11,
      targetWindingIds: expect.any(Array),
      terminalLayerSets: Array.from({ length: 11 }, () => ["top", "inner2"]),
    },
    {
      busId: "DDR_BYTE1",
      preferredLayer: "inner2",
      connectionCount: 11,
      targetLayerCount: 11,
      targetWindingIds: expect.any(Array),
      terminalLayerSets: Array.from({ length: 11 }, () => ["top", "inner2"]),
    },
    {
      busId: "DDR_ADDR_CTRL",
      preferredLayer: "bottom",
      connectionCount: 11,
      targetLayerCount: 11,
      targetWindingIds: expect.any(Array),
      terminalLayerSets: Array.from({ length: 11 }, () => ["top", "bottom"]),
    },
  ])
  expect(summaries[1]).toEqual(summaries[0])
})
