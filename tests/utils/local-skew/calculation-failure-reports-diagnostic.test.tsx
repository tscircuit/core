import { expect, spyOn, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"
import { PairBoard } from "tests/fixtures/local-skew/pair-board"

test("one failed local skew calculation reports an error and preserves the other pair", async () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <panel width={100} height={50} layoutMode="grid">
      <PairBoard pairName="FAULTY_PAIR" positivePath={[]} negativePath={[]} />
      <PairBoard pairName="GOOD_PAIR" positivePath={[]} negativePath={[]} />
    </panel>,
  )
  await circuit.renderUntilSettled()
  const badBus = circuit.db.source_bus.getWhere({ name: "FAULTY_PAIR" })!
  const goodBus = circuit.db.source_bus.getWhere({ name: "GOOD_PAIR" })!
  const faultyTrace = circuit.db.pcb_trace.getWhere({
    source_trace_id: badBus.differential_pair!.positive_source_trace_id,
  })!
  expect(getStoredLocalSkew(circuit.getCircuitJson())).toHaveLength(2)

  const routeIterator = spyOn(
    faultyTrace.route,
    Symbol.iterator,
  ).mockImplementationOnce(() => {
    throw new Error("Injected route read failure")
  })
  try {
    circuit.firstChild!._markDirty("PcbDifferentialPairLocalSkewRender")
    circuit.render()
  } finally {
    routeIterator.mockRestore()
  }

  expect(
    getStoredLocalSkew(circuit.getCircuitJson()).map(
      (pair) => pair.source_bus_id,
    ),
  ).toEqual([goodBus.source_bus_id])
  expect(circuit.db.source_runtime_error.list()).toEqual([
    expect.objectContaining({
      phase_name: "PcbDifferentialPairLocalSkewRender",
      message:
        'Could not calculate local skew for differential pair "FAULTY_PAIR".',
    }),
  ])
  await expect(localSkewSvg(circuit.getCircuitJson())).toMatchSvgSnapshot(
    import.meta.path,
  )

  circuit.firstChild!._markDirty("PcbDifferentialPairLocalSkewRender")
  circuit.render()
  expect(getStoredLocalSkew(circuit.getCircuitJson())).toHaveLength(2)
  expect(circuit.db.source_runtime_error.list()).toEqual([])
})
