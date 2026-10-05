import { expect, test } from "bun:test"
import { Circuit } from "lib"

test("repro3906: pcbPath chooses shared layer when plated-hole connects to explicit bottom via port", async () => {
  for (const reverse of [false, true]) {
    const circuit = new Circuit()
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
    const data = circuit.getCircuitJson()
    const source = data.find(
      (r: any) => r.type === "source_trace" && r.name === "PATH",
    ) as any
    const trace = data.find(
      (r: any) =>
        r.type === "pcb_trace" && r.source_trace_id === source.source_trace_id,
    ) as any
    const layers = [
      ...new Set(
        trace.route
          .filter((p: any) => p.route_type === "wire")
          .map((p: any) => p.layer),
      ),
    ]

    expect(layers).toEqual(["bottom"])
  }
})
