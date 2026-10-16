import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsVertically } from "stack-svgs"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("snapshot missing inner2 connection between through vias", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  circuit.add(
    <board width={12} height={4} layers={4} routeRemaining={false}>
      <via
        name="VA"
        pcbX={-2.5}
        pcbY={0}
        fromLayer="top"
        toLayer="bottom"
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.SIG"
      />
      <via
        name="VB"
        pcbX={2.5}
        pcbY={0}
        fromLayer="top"
        toLayer="bottom"
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.SIG"
      />
      <trace
        from="VA.inner2"
        to="VB.inner2"
        thickness={0.2}
        pcbPath={["VA.inner2", "VB.inner2"]}
      />
      <pcbnotetext pcbX={-2.5} pcbY={1.1} fontSize={0.45} text="VA.inner2" />
      <pcbnotetext pcbX={2.5} pcbY={1.1} fontSize={0.45} text="VB.inner2" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const inner2Traces = circuit.db.pcb_trace
    .list()
    .filter(
      (trace) =>
        trace.route.length >= 2 &&
        trace.route.every(
          (point) => point.route_type === "wire" && point.layer === "inner2",
        ),
    )
  const connected = inner2Traces.length === 1
  const explanationSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="144" viewBox="0 0 1800 144">
    <rect width="1800" height="144" fill="#141414" />
    <g font-family="sans-serif" text-anchor="middle">
      <text x="900" y="42" font-size="38" font-weight="bold" fill="${connected ? "#4ade80" : "#fb7185"}">Inner2 connection: ${connected ? "PASSING" : "FAILING"}</text>
      <text x="900" y="86" font-size="28" fill="#f4f4f4">Expected: a copper trace connecting VA.inner2 to VB.inner2.</text>
      <text x="900" y="126" font-size="28" fill="#f4f4f4">Actual: ${inner2Traces.length} inner2 traces${connected ? "; vias connected" : "; vias disconnected"}.</text>
    </g>
  </svg>`
  const svg = stackSvgsVertically(
    [
      explanationSvg,
      convertCircuitJsonToPcbSvg(circuit.getCircuitJson(), {
        layer: "inner2",
        width: 1800,
        height: 560,
      }),
    ],
    { gap: 16, normalizeSize: false },
  )
  await expect(svg).toMatchSvgSnapshot(
    import.meta.path,
    "repro-via-inner2-ports",
    { diffThresholdPercent: 0 },
  )
})
