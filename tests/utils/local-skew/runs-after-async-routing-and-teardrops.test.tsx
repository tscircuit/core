import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("local skew starts only after asynchronous routing and teardrops finish", async () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <board width={20} height={8}>
      <testpoint
        name="P1"
        footprintVariant="pad"
        padDiameter={0.8}
        doNotPlace
        pcbX={-8}
        pcbY={0.6}
      />
      <testpoint
        name="P2"
        footprintVariant="pad"
        padDiameter={0.8}
        doNotPlace
        pcbX={8}
        pcbY={0.6}
      />
      <testpoint
        name="N1"
        footprintVariant="pad"
        padDiameter={0.8}
        doNotPlace
        pcbX={-8}
        pcbY={-0.6}
      />
      <testpoint
        name="N2"
        footprintVariant="pad"
        padDiameter={0.8}
        doNotPlace
        pcbX={8}
        pcbY={-0.6}
      />
      <trace
        name="DP"
        from=".P1 > .pin1"
        to=".P2 > .pin1"
        thickness={0.15}
        pcbTeardropStart
      />
      <trace name="DN" from=".N1 > .pin1" to=".N2 > .pin1" thickness={0.15} />
      <differentialpair
        name="PAIR"
        positiveConnection="DP"
        negativeConnection="DN"
        pcbTraceGap={1.05}
      />
      <pcbnotetext
        pcbY={2.5}
        fontSize={0.4}
        text="Autorouted pair; DP has a teardrop at P1"
      />
    </board>,
  )
  const events: string[] = []
  circuit.on("asyncEffect:end", (event) => {
    if (event.phase === "PcbTraceRender") events.push("routing finished")
  })
  circuit.on("renderable:renderLifecycle:anyEvent", (event) => {
    if (event.renderId !== circuit.firstChild?._renderId) return
    if (event.type === "renderable:renderLifecycle:PcbTraceTeardropRender:end")
      events.push("teardrops")
    if (
      event.type ===
      "renderable:renderLifecycle:PcbDifferentialPairLocalSkewRender:start"
    )
      events.push("local skew")
  })
  await circuit.renderUntilSettled()

  expect(events).toEqual(["routing finished", "teardrops", "local skew"])
  // The walk includes the point the teardrop adds 1.2 mm from P1.
  const [localSkew] = circuit.db
    .toArray()
    .filter(
      (element) => String(element.type) === "pcb_differential_pair_local_skew",
    )
  expect(localSkew).toMatchObject({
    positive: {
      segments: [
        { start: { x: -8, y: 0.6 }, end: { x: -6.8, y: 0.6 } },
        { start: { x: -6.8, y: 0.6 }, end: { x: 8, y: 0.6 } },
      ],
    },
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
