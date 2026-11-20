import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { CircuitJson } from "circuit-json"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import {
  PairBoard,
  renderPairBoard,
  type PairPathPoint,
} from "tests/fixtures/local-skew/pair-board"

const VIA_HOP: PairPathPoint[] = [
  { x: 6, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
  { x: 18, y: 0, via: true, fromLayer: "bottom", toLayer: "top" },
]

/** Renders a two-board panel: one 1.6 mm JLCPCB preset board and one plain 0.8 mm board. */
async function renderPanel(
  stackupFirst: boolean,
  subcircuitName?: string,
): Promise<CircuitJson> {
  const stackupBoard = (
    <PairBoard
      pairName="STACKUP"
      positivePath={[]}
      negativePath={VIA_HOP}
      pcbTraceGap="0.45mm"
      thickness="1.6mm"
      fabricatorPreset="jlcpcb_standard"
    />
  )
  const plainBoard = (
    <PairBoard
      pairName="PLAIN"
      subcircuitName={subcircuitName}
      positivePath={[]}
      negativePath={VIA_HOP}
      pcbTraceGap="0.45mm"
      thickness="0.8mm"
    />
  )
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  const boards = [stackupBoard, plainBoard]
  if (!stackupFirst) boards.reverse()
  circuit.add(
    <panel width="100mm" height="50mm" layoutMode="grid">
      {boards[0]}
      {boards[1]}
    </panel>,
  )
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson()
}

test("each board in a panel uses only its own stackup or thickness, never a neighbour's", async () => {
  // JLCPCB 2-layer 1.6 mm stackup: 0.03 + 1.43 + 0.03 = 1.49 mm per via -> 2.98 mm.
  // Plain 0.8 mm board with no stackup: 0.80 mm per via -> 1.60 mm.
  const stackupFirstJson = await renderPanel(true)
  const plainFirstJson = await renderPanel(false)

  for (const circuitJson of [
    stackupFirstJson,
    plainFirstJson,
    await renderPanel(true, "G"),
  ]) {
    const pairs = getStoredLocalSkew(circuitJson)
    const buses = circuitJson.filter((element) => element.type === "source_bus")
    const stackupBus = buses.find((bus) => bus.name === "STACKUP")
    const plainBus = buses.find((bus) => bus.name === "PLAIN")
    const stackupPair = pairs.find(
      (pair) => pair.source_bus_id === stackupBus?.source_bus_id,
    )
    const plainPair = pairs.find(
      (pair) => pair.source_bus_id === plainBus?.source_bus_id,
    )
    expect(stackupPair?.max_local_skew).toBeCloseTo(2.98, 5)
    expect(plainPair?.max_local_skew).toBeCloseTo(1.6, 5)
  }

  const nestedPairJson = renderPairBoard({
    subcircuitName: "G",
    positivePath: [],
    negativePath: VIA_HOP,
    pcbTraceGap: "0.45mm",
    thickness: "0.8mm",
  })
  expect(getStoredLocalSkew(nestedPairJson)[0]?.max_local_skew).toBeCloseTo(
    1.6,
    5,
  )

  await expect(localSkewSvg(stackupFirstJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
