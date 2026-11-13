import { beforeAll, expect, test } from "bun:test"
import type { LayerRef } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const observedLayers: Array<{
  api: "pcbPath" | "pcbPaths"
  reverse: boolean
  layers: LayerRef[]
}> = []

beforeAll(async () => {
  const rows: string[] = []
  for (const api of ["pcbPath", "pcbPaths"] as const) {
    const panels: string[] = []
    for (const reverse of [false, true]) {
      const { circuit } = getTestFixture()
      const from = reverse ? ".V1 > .bottom" : "J1.pin1"
      const to = reverse ? "J1.pin1" : ".V1 > .bottom"
      // Numeric bends are footprint-local points in mm (+X right, +Y up,
      // +Z above, right-handed); the emitted route is in board-world mm.
      const bend = { x: reverse ? -2 : 2, y: 1 }
      circuit.add(
        <board
          width={10}
          height={8}
          layers={2}
          schematicDisabled
          routingDisabled
        >
          <net name="SIGNAL" />
          <chip
            name="J1"
            pcbX={-2}
            pinLabels={{ pin1: "SIGNAL" }}
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
            from={from}
            to={to}
            thickness={0.25}
            {...(api === "pcbPath"
              ? { pcbPath: [bend] }
              : { pcbPaths: [[from, bend, to]] })}
          />
          <pcbnotetext
            pcbX={-2}
            pcbY={-1.4}
            text="J1: plated hole"
            fontSize={0.4}
          />
          <pcbnotetext pcbX={2} pcbY={-1.4} text="V1.bottom" fontSize={0.4} />
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
      expect(circuit.db.pcb_via.list()).toHaveLength(1)
      const layers = [
        ...new Set(
          pcbTraces[0]!.route.flatMap((point) =>
            point.route_type === "wire" ? [point.layer] : [],
          ),
        ),
      ]
      observedLayers.push({ api, reverse, layers })

      const drawing = convertCircuitJsonToPcbSvg(circuit.getCircuitJson(), {
        width: 500,
        height: 360,
        showPcbNotes: true,
        shouldDrawErrors: false,
        shouldDrawRatsNest: false,
      })
      const title = `${api}: ${reverse ? "via.bottom to plated hole" : "plated hole to via.bottom"}`
      panels.push(
        `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="470" viewBox="0 0 500 470"><rect width="500" height="470" fill="white"/><g font-family="monospace" fill="black"><text x="14" y="25" font-size="16" font-weight="bold">${title}</text><text x="14" y="49" font-size="13">Expected: BOTTOM in both endpoint orders.</text><text x="14" y="71" font-size="13">Observed wires: ${layers.join(", ").toUpperCase()}</text><text x="14" y="93" font-size="12">Red = TOP; blue = BOTTOM. One existing via.</text></g><g transform="translate(0 110)">${drawing}</g></svg>`,
      )
    }
    rows.push(stackSvgsHorizontally(panels, { gap: 16, normalizeSize: false }))
  }
  // Snapshot errors must fail CI independently of the expected geometry failure.
  await expect(
    stackSvgsVertically(rows, { gap: 16, normalizeSize: false }),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})

test("manual paths to an explicit bottom port use bottom copper in both endpoint orders", () => {
  expect(observedLayers).toEqual([
    { api: "pcbPath", reverse: false, layers: ["bottom"] },
    { api: "pcbPath", reverse: true, layers: ["bottom"] },
    { api: "pcbPaths", reverse: false, layers: ["bottom"] },
    { api: "pcbPaths", reverse: true, layers: ["bottom"] },
  ])
})
