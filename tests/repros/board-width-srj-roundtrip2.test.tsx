import { expect, test } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import { renderBoardWidthSrjRoundTrip } from "tests/fixtures/render-board-width-srj-round-trip"

test("routed copper shows the trace widths from regenerated SRJ", async () => {
  const { circuitJson, srj, defaultConnection, explicitConnection } =
    await renderBoardWidthSrjRoundTrip()
  const routedTraces = new TscircuitAutorouter(srj).solveSync()
  expect(routedTraces).toHaveLength(2)

  const getCopperWidths = (connectionName: string) => {
    const wirePoints = routedTraces
      .find(({ connection_name }) => connection_name === connectionName)
      ?.route.filter((point) => point.route_type === "wire")
    if (!wirePoints || wirePoints.length < 2) {
      throw new Error("Expected a routed wire connecting both pads")
    }
    return [...new Set(wirePoints.map(({ width }) => width))]
  }

  expect({
    minTraceWidth: srj.minTraceWidth,
    nominalTraceWidth: srj.nominalTraceWidth,
    boardDefault: {
      srjWidth: defaultConnection.nominalTraceWidth,
      copperWidths: getCopperWidths(defaultConnection.name),
    },
    explicit: {
      srjWidth: explicitConnection.nominalTraceWidth,
      copperWidths: getCopperWidths(explicitConnection.name),
    },
  }).toMatchInlineSnapshot(`
    {
      "boardDefault": {
        "copperWidths": [
          0.1,
        ],
        "srjWidth": 0.1,
      },
      "explicit": {
        "copperWidths": [
          0.55,
        ],
        "srjWidth": 0.55,
      },
      "minTraceWidth": 0.1,
      "nominalTraceWidth": undefined,
    }
  `)

  await expect([...circuitJson, ...routedTraces]).toMatchPcbSnapshot(
    import.meta.path,
    { showPcbNotes: true },
  )
})
