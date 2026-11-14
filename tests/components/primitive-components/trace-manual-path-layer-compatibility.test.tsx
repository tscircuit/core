import { beforeAll, expect, test } from "bun:test"
import type { PcbPath } from "@tscircuit/props"
import type { LayerRef } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const observedPathLayers: Array<{
  caseName: string
  layers: LayerRef[]
  expectedLayers: LayerRef[]
}> = []

beforeAll(async () => {
  for (const api of ["pcbPath", "pcbPaths"] as const) {
    for (const scenario of [
      { name: "top_endpoint", layers: ["top"], vias: 0 },
      { name: "plated_endpoints", layers: ["top"], vias: 0 },
      { name: "free_end", layers: ["bottom"], vias: 1 },
      { name: "explicit_vias", layers: ["top", "bottom"], vias: 2 },
      { name: "selector_contact", layers: ["bottom"], vias: 1 },
      { name: "separate_placement_anchor", layers: ["bottom"], vias: 1 },
    ] satisfies Array<{ name: string; layers: LayerRef[]; vias: number }>) {
      if (scenario.name === "separate_placement_anchor" && api === "pcbPath")
        continue
      const { circuit } = getTestFixture()
      const freeEnd = scenario.name === "free_end"
      const separateAnchor = scenario.name === "separate_placement_anchor"
      const placedVia =
        freeEnd || separateAnchor || scenario.name === "selector_contact"
      const from = freeEnd ? ".V1 > .bottom" : "J1.1"
      const to = freeEnd ? undefined : separateAnchor ? ".V1 > .bottom" : "J2.1"
      // These are footprint-local points in mm (+X right, +Y up, +Z above,
      // right-handed). A separate pcbPaths anchor supplies only the XY frame.
      const bends: PcbPath =
        scenario.name === "explicit_vias"
          ? [
              { x: 1, y: 1, via: true, fromLayer: "top", toLayer: "bottom" },
              { x: 3, y: 2 },
              { x: 5, y: 1, via: true, fromLayer: "bottom", toLayer: "top" },
            ]
          : scenario.name === "selector_contact"
            ? [".V1 > .bottom"]
            : separateAnchor
              ? [{ x: 3, y: 4 }]
              : [{ x: 3, y: 1 }]
      circuit.add(
        <board width={14} height={12} schematicDisabled routingDisabled>
          <chip
            name="J1"
            pcbX={-3}
            pinLabels={{ pin1: "START" }}
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
          <chip
            name="J2"
            pcbX={3}
            pinLabels={{ pin1: "END" }}
            footprint={
              <footprint>
                {scenario.name === "top_endpoint" ? (
                  <smtpad
                    portHints={["1"]}
                    shape="rect"
                    width={0.8}
                    height={0.8}
                  />
                ) : (
                  <platedhole
                    portHints={["1"]}
                    shape="circle"
                    outerDiameter={1.4}
                    holeDiameter={0.8}
                  />
                )}
              </footprint>
            }
          />
          {placedVia && (
            <via
              name="V1"
              pcbY={2}
              holeDiameter={0.3}
              outerDiameter={0.6}
              fromLayer="top"
              toLayer="bottom"
            />
          )}
          {separateAnchor && (
            <chip
              name="ORIGIN"
              pcbX={-3}
              pcbY={-3}
              pinLabels={{ pin1: "XY_ONLY" }}
              footprint={
                <footprint>
                  <smtpad
                    portHints={["1"]}
                    shape="rect"
                    width={0.8}
                    height={0.8}
                  />
                </footprint>
              }
            />
          )}
          <trace
            name="PATH"
            path={to ? [from, to] : [from]}
            pcbPathRelativeTo={separateAnchor ? "ORIGIN.1" : undefined}
            {...(api === "pcbPath"
              ? { pcbPath: bends }
              : { pcbPaths: [[from, ...bends, ...(to ? [to] : [])]] })}
          />
          <pcbnotetext
            pcbY={4.8}
            fontSize={0.45}
            text={`${api}: ${scenario.name.replaceAll("_", " ")}`}
          />
          <pcbnotetext
            pcbY={-4.8}
            fontSize={0.45}
            text={`Expected wires: ${scenario.layers.join(" / ")}`}
          />
        </board>,
      )
      await circuit.renderUntilSettled()
      const sourceTrace = circuit.db.source_trace
        .list()
        .find((trace) => trace.name === "PATH")!
      const pcbTraces = circuit.db.pcb_trace
        .list()
        .filter(
          (trace) => trace.source_trace_id === sourceTrace.source_trace_id,
        )
      expect(pcbTraces).toHaveLength(1)
      observedPathLayers.push({
        caseName: `${api}: ${scenario.name}`,
        layers: [
          ...new Set(
            pcbTraces[0]!.route.flatMap((point) =>
              point.route_type === "wire" ? [point.layer] : [],
            ),
          ),
        ],
        expectedLayers: scenario.layers,
      })
      expect(circuit.db.pcb_via.list()).toHaveLength(scenario.vias)
      if (scenario.name === "explicit_vias") {
        expect(
          pcbTraces[0]!.route
            .filter((point) => point.route_type === "via")
            .map((point) => [point.from_layer, point.to_layer]),
        ).toEqual([
          ["top", "bottom"],
          ["bottom", "top"],
        ])
      }
      // Keep snapshot failures outside the expected-failure assertion.
      await expect(circuit).toMatchPcbSnapshot(
        import.meta.path.replace(
          ".test.tsx",
          `-${api}-${scenario.name}.test.tsx`,
        ),
        {
          shouldDrawRatsNest: false,
          shouldDrawErrors: false,
          showPcbNotes: true,
        },
      )
    }
  }
}, 30000)

test("manual path layers preserve defaults, escapes, via transitions, and selector contacts", () => {
  expect(
    observedPathLayers.map(({ caseName, layers }) => ({ caseName, layers })),
  ).toEqual(
    observedPathLayers.map(({ caseName, expectedLayers }) => ({
      caseName,
      layers: expectedLayers,
    })),
  )
})
