import { expect, test } from "bun:test"
import type { RootCircuit } from "lib"
import { createPcbLayerStackSvg } from "tests/fixtures/create-pcb-layer-stack-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  ConnectedManualViaPcbPathBoard,
  DisconnectedManualViaPcbPathBoard,
} from "tests/fixtures/manual-via-transition"

const layers = ["top", "inner1", "inner2", "bottom"]
const layerY = (layer: string) => 160 + layers.indexOf(layer) * 75

/**
 * X/layer cutaway of emitted copper at Y=0. X is board-world mm (+X right);
 * physical layer order runs downward on the page with schematic spacing.
 */
function copperCutaway(circuit: RootCircuit, originX: number) {
  const x = (boardX: number) => originX + boardX * 40
  const wires = circuit.db.pcb_trace
    .list()
    .flatMap((trace) =>
      trace.route.slice(1).map((point, routeIndex) => {
        const previous = trace.route[routeIndex]!
        if (point.route_type !== "wire" && point.route_type !== "via") return ""
        if (previous.route_type !== "wire" && previous.route_type !== "via")
          return ""
        const layer =
          previous.route_type === "wire" ? previous.layer : previous.to_layer
        return `<line x1="${x(previous.x)}" x2="${x(point.x)}" y1="${layerY(layer)}" y2="${layerY(layer)}" stroke="#b7791f" stroke-width="6" stroke-linecap="round"/>`
      }),
    )
    .join("")
  const vias = circuit.db.pcb_via.list()
  const barrels = vias
    .map((via) => {
      const occupiedY = via.layers.map(layerY)
      const topY = Math.min(...occupiedY)
      const bottomY = Math.max(...occupiedY)
      return `<rect x="${x(via.x) - 6}" y="${topY - 6}" width="12" height="${bottomY - topY + 12}" rx="3" fill="#8d5919"/>`
    })
    .join("")
  const firstVia = vias[0]
  const gap =
    firstVia && !firstVia.layers.includes("top")
      ? `<circle cx="${x(firstVia.x)}" cy="${layerY("top")}" r="11" fill="none" stroke="#b91c1c" stroke-width="2"/>
       <line x1="${x(firstVia.x)}" x2="${x(firstVia.x)}" y1="172" y2="${Math.min(...firstVia.layers.map(layerY)) - 12}" stroke="#b91c1c" stroke-width="2" stroke-dasharray="4 4"/>
       <text x="${x(firstVia.x) + 14}" y="240" fill="#b91c1c">gap</text>`
      : ""
  return wires + barrels + gap
}

test("manual via contact snapshots show rejected and valid geometry", async () => {
  const { circuit: invalidCircuit } = getTestFixture()
  invalidCircuit.schematicDisabled = true
  invalidCircuit.add(<DisconnectedManualViaPcbPathBoard />)
  await invalidCircuit.renderUntilSettled()

  const { circuit: validCircuit } = getTestFixture()
  validCircuit.schematicDisabled = true
  validCircuit.add(<ConnectedManualViaPcbPathBoard />)
  await validCircuit.renderUntilSettled()

  expect(validCircuit.db.pcb_trace_error.list()).toEqual([])
  expect(validCircuit.db.pcb_trace.list()).toHaveLength(1)
  expect(validCircuit.db.pcb_via.list()).toHaveLength(2)

  const rejected =
    invalidCircuit.db.pcb_trace.list().length === 0 &&
    invalidCircuit.db.pcb_via.list().length === 0 &&
    invalidCircuit.db.pcb_trace_error
      .list()
      .some((error) => /does not reach incoming top/.test(error.message))
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="440" viewBox="0 0 900 440">
      <rect width="900" height="440" fill="white"/>
      <g font-family="Arial, sans-serif" font-size="18" fill="#222">
        <text x="450" y="44" text-anchor="middle" font-size="25" fill="${rejected ? "#15803d" : "#b91c1c"}">${rejected ? "PASS: invalid rejected" : "FAIL: disconnected via accepted"}</text>
        <text x="250" y="105" text-anchor="middle">Invalid</text>
        <text x="650" y="105" text-anchor="middle">Valid</text>
        ${layers.map((layer) => `<text x="20" y="${layerY(layer) + 6}">${layer}</text><path d="M95 ${layerY(layer)}H425 M495 ${layerY(layer)}H825" stroke="#ddd" stroke-width="1" fill="none"/>`).join("")}
        ${copperCutaway(invalidCircuit, 250)}
        ${copperCutaway(validCircuit, 650)}
        ${rejected ? '<text x="250" y="250" text-anchor="middle" fill="#15803d">rejected</text>' : ""}
      </g>
    </svg>`.replaceAll(/[ \t]+\n/g, "\n")
  await expect(svg).toMatchSvgSnapshot(import.meta.path, undefined, {
    diffThresholdPercent: 0,
  })

  const layerStackSvg = createPcbLayerStackSvg(invalidCircuit.getCircuitJson())
  await expect(layerStackSvg).toMatchSvgSnapshot(
    import.meta.path,
    "manual-via-transition-layers",
    { diffThresholdPercent: 0 },
  )
})
