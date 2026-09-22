import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A manual pcbPath must run on a layer both endpoints can reach — a plated
// hole anchoring to a via's `.bottom` port should not emit on top copper.

test("manual pcbPath picks a layer available at both endpoints", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" layers={2} schematicDisabled>
      <net name="SIGNAL" />
      <chip
        name="J1"
        pcbX={-2}
        pinLabels={{ pin1: ["SIGNAL"] }}
        footprint={
          <footprint>
            <platedhole
              portHints={["1"]}
              shape="circle"
              outerDiameter={1.4}
              holeDiameter={0.8}
            />
          </footprint>
        }
      />
      <via
        name="V1"
        pcbX={2}
        holeDiameter={0.3}
        outerDiameter={0.6}
        fromLayer="top"
        toLayer="bottom"
        connectsTo="net.SIGNAL"
      />
      <trace from="J1.pin1" to="net.SIGNAL" />
      <trace
        name="PATH"
        from="J1.pin1"
        to=".V1 > .bottom"
        pcbPath={[{ x: 2, y: 1 }]}
        thickness={0.25}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceTrace = circuit.db.source_trace
    .list()
    .find((t) => t.name === "PATH")!
  const pcbTrace = circuit.db.pcb_trace
    .list()
    .find((t) => t.source_trace_id === sourceTrace.source_trace_id)!
  const wireLayers = [
    ...new Set(
      pcbTrace.route.filter((p) => p.route_type === "wire").map((p) => p.layer),
    ),
  ]
  expect(wireLayers).toEqual(["bottom"])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
