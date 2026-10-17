import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual pcbPath between a plated hole and an explicit bottom via port uses the shared bottom layer in both directions", async () => {
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
      </board>,
    )

    await circuit.renderUntilSettled()

    const source = circuit.db.source_trace
      .list()
      .find((r) => (r as { name?: string }).name === "PATH")
    expect(source).toBeDefined()

    const pcbTrace = circuit.db.pcb_trace
      .list()
      .find((t) => t.source_trace_id === source?.source_trace_id)
    expect(pcbTrace).toBeDefined()

    const wireLayers = [
      ...new Set(
        pcbTrace!.route
          .filter((p) => p.route_type === "wire")
          .map((p) => p.layer),
      ),
    ]
    expect(wireLayers).toEqual(["bottom"])
  }
})
