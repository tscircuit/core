import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual pcbPath uses the shared endpoint layer in either direction", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={12} height={12} layers={2} schematicDisabled>
      {[false, true].map((reverse) => {
        const name = reverse ? "REVERSE" : "FORWARD"
        const y = reverse ? -3 : 3
        return (
          <group key={name}>
            <net name={name} />
            <chip
              name={`J${name}`}
              pcbX={-2}
              pcbY={y}
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
              name={`V${name}`}
              pcbX={2}
              pcbY={y}
              holeDiameter={0.3}
              outerDiameter={0.6}
              fromLayer="top"
              toLayer="bottom"
              connectsTo={`net.${name}`}
            />
            <trace from={`J${name}.pin1`} to={`net.${name}`} />
            <trace
              name={name}
              from={reverse ? `.V${name} > .bottom` : `J${name}.pin1`}
              to={reverse ? `J${name}.pin1` : `.V${name} > .bottom`}
              pcbPath={[{ x: reverse ? -2 : 2, y: 1 }]}
              thickness={0.25}
            />
            <silkscreentext
              text={`${name}: bottom copper`}
              pcbY={y - 1}
              fontSize={0.5}
            />
          </group>
        )
      })}
    </board>,
  )

  await circuit.renderUntilSettled()

  for (const name of ["FORWARD", "REVERSE"]) {
    const sourceTrace = circuit.db.source_trace
      .list()
      .find((t) => t.name === name)!
    const pcbTrace = circuit.db.pcb_trace
      .list()
      .find((t) => t.source_trace_id === sourceTrace.source_trace_id)!
    expect(pcbTrace).toBeDefined()
    const wireLayers = pcbTrace.route
      .filter((point) => point.route_type === "wire")
      .map((point) => point.layer)
    expect(new Set(wireLayers)).toEqual(new Set(["bottom"]))
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
