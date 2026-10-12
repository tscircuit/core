import { expect, test } from "bun:test"
import { stackSvgsVertically } from "stack-svgs"
import { createPcbLayerStackSvg } from "tests/fixtures/create-pcb-layer-stack-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("snapshot through-via ports on every PCB layer", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  circuit.add(
    <board width={20} height={14} layers={4} routeRemaining={false}>
      <via
        name="TopA"
        pcbX={-2}
        pcbY={4.5}
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.TOP"
      />
      <via
        name="TopB"
        pcbX={2}
        pcbY={4.5}
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.TOP"
      />
      <trace
        from="TopA.top"
        to="TopB.top"
        thickness={0.2}
        pcbPath={["TopA.top", "TopB.top"]}
      />
      <pcbnotetext pcbX={-4} pcbY={4.5} fontSize={0.5} text="top" />

      <via
        name="Inner1A"
        pcbX={-2}
        pcbY={1.5}
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.INNER1"
      />
      <via
        name="Inner1B"
        pcbX={2}
        pcbY={1.5}
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.INNER1"
      />
      <trace
        from="Inner1A.inner1"
        to="Inner1B.inner1"
        thickness={0.2}
        pcbPath={["Inner1A.inner1", "Inner1B.inner1"]}
      />
      <pcbnotetext pcbX={-4} pcbY={1.5} fontSize={0.5} text="inner1" />

      <via
        name="Inner2A"
        pcbX={-2}
        pcbY={-1.5}
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.INNER2"
      />
      <via
        name="Inner2B"
        pcbX={2}
        pcbY={-1.5}
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.INNER2"
      />
      <trace
        from="Inner2A.inner2"
        to="Inner2B.inner2"
        thickness={0.2}
        pcbPath={["Inner2A.inner2", "Inner2B.inner2"]}
      />
      <pcbnotetext pcbX={-4} pcbY={-1.5} fontSize={0.5} text="inner2" />

      <via
        name="BottomA"
        pcbX={-2}
        pcbY={-4.5}
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.BOTTOM"
      />
      <via
        name="BottomB"
        pcbX={2}
        pcbY={-4.5}
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.BOTTOM"
      />
      <trace
        from="BottomA.bottom"
        to="BottomB.bottom"
        thickness={0.2}
        pcbPath={["BottomA.bottom", "BottomB.bottom"]}
      />
      <pcbnotetext pcbX={-4} pcbY={-4.5} fontSize={0.5} text="bottom" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const layers = ["top", "inner1", "inner2", "bottom"] as const
  const traces = circuit.db.pcb_trace.list()
  const connectedLayers = layers.filter((layer) =>
    traces.some(
      (trace) =>
        trace.route.length >= 2 &&
        trace.route.every(
          (point) => point.route_type === "wire" && point.layer === layer,
        ),
    ),
  )
  const missingLayers = layers.filter(
    (layer) => !connectedLayers.includes(layer),
  )
  const connected = missingLayers.length === 0
  const explanationSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="104" viewBox="0 0 800 104">
    <rect width="800" height="104" fill="#141414" />
    <g font-family="sans-serif" text-anchor="middle">
      <text x="400" y="32" font-size="25" font-weight="bold" fill="${connected ? "#4ade80" : "#fb7185"}">Repro: ${connected ? "PASSING" : "FAILING"}</text>
      <text x="400" y="62" font-size="16" fill="#f4f4f4">Expected: 4 copper connections, one on each labeled layer.</text>
      <text x="400" y="88" font-size="16" fill="#f4f4f4">Actual: ${connectedLayers.length} connections${connected ? "; all four layers connected" : `; missing ${missingLayers.join(", ")}`}.</text>
    </g>
  </svg>`
  const svg = stackSvgsVertically(
    [explanationSvg, createPcbLayerStackSvg(circuit.getCircuitJson())],
    { gap: 16, normalizeSize: false },
  )
  await expect(svg).toMatchSvgSnapshot(
    import.meta.path,
    "repro-via-inner2-ports-layers",
    { diffThresholdPercent: 0 },
  )
})
