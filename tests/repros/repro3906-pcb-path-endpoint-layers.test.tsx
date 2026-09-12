import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbPath respects bottom via endpoints in either direction", async () => {
  for (const reverse of [false, true]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={10} height={10} layers={2} schematicDisabled>
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
          from={reverse ? ".V1 > .bottom" : "J1.pin1"}
          to={reverse ? "J1.pin1" : ".V1 > .bottom"}
          pcbPath={[{ x: reverse ? -2 : 2, y: 1 }]}
          thickness={0.25}
        />
        <pcbnotetext
          pcbY={-3}
          text={
            reverse
              ? "Via bottom to PTH: bottom copper"
              : "PTH to via bottom: bottom copper"
          }
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const source = circuit.db.source_trace
      .list()
      .find((trace) => trace.name === "PATH")!
    const trace = circuit.db.pcb_trace
      .list()
      .find((trace) => trace.source_trace_id === source.source_trace_id)!
    expect(trace).toBeDefined()
    expect([
      ...new Set(
        trace.route
          .filter((point) => point.route_type === "wire")
          .map((point) => point.layer),
      ),
    ]).toEqual(["bottom"])
    expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)
    await expect(circuit).toMatchPcbSnapshot(
      `${import.meta.path}-${reverse ? "via-first" : "pth-first"}`,
    )
  }
})
