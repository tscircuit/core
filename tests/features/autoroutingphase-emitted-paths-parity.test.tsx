import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsHorizontally } from "stack-svgs"
import type { AutoroutingEndEvent } from "lib/events"
import { getPcbSvgPixelParity } from "tests/fixtures/get-pcb-svg-pixel-parity"
import "tests/fixtures/extend-expect-any-svg"
import { createDenseRp2040UnphasedCircuit } from "./autorouter-dense-rp2040-phases.fixture"

test("dense RP2040 emitted PCB paths replay the autorouter copper with visual parity", async () => {
  const { circuit } = createDenseRp2040UnphasedCircuit("beta_pipeline9")
  const completed: AutoroutingEndEvent[] = []
  circuit.on("autorouting:end", (event) => completed.push(event))
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(completed).toHaveLength(1)
  expect(completed[0]!.pcbTracePathsUnavailableReason).toBeUndefined()
  expect(completed[0]!.pcbTracePaths).toHaveLength(18)
  // Use the JSON boundary, as a consumer writing then importing the artifact does.
  const paths = JSON.parse(JSON.stringify(completed[0]!.pcbTracePaths))
  const { circuit: replay } = createDenseRp2040UnphasedCircuit(
    "beta_pipeline9",
    paths,
  )
  const routers: string[] = []
  replay.on("autorouting:start", (event) => routers.push(event.autorouterName!))
  await replay.renderUntilSettled()
  expect(routers).toEqual(["precomputed"])
  expect(replay.db.pcb_autorouting_error.list()).toEqual([])
  expect(replay.db.pcb_trace.list()).toHaveLength(
    circuit.db.pcb_trace.list().length,
  )
  expect(circuit.db.pcb_via.list().length).toBeGreaterThan(0)
  expect(replay.db.pcb_via.list()).toHaveLength(
    circuit.db.pcb_via.list().length,
  )
  const originalSvg = convertCircuitJsonToPcbSvg(circuit.getCircuitJson())
  const replaySvg = convertCircuitJsonToPcbSvg(replay.getCircuitJson())
  const parity = getPcbSvgPixelParity(originalSvg, replaySvg)
  console.log("Dense RP2040 saved-path parity", parity)
  expect(parity.parityPercent).toBeGreaterThanOrEqual(99.99)
  expect(parity.foregroundParityPercent).toBeGreaterThanOrEqual(99.9)
  // A missing trace must fail the comparison; blank background cannot hide it.
  const removedTraceId = replay.db.pcb_trace.list()[0]!.pcb_trace_id
  const missingTraceSvg = convertCircuitJsonToPcbSvg(
    replay
      .getCircuitJson()
      .filter(
        (element) =>
          element.type !== "pcb_trace" ||
          element.pcb_trace_id !== removedTraceId,
      ),
  )
  expect(
    getPcbSvgPixelParity(originalSvg, missingTraceSvg).foregroundParityPercent,
  ).toBeLessThan(99.9)
  const labelled = (svg: string, label: string) =>
    svg.replace(
      /<\/svg>$/,
      `<text x="20" y="18" fill="white" font-size="14">${label}</text></svg>`,
    )
  await expect(
    stackSvgsHorizontally(
      [
        labelled(originalSvg, "AUTOROUTED"),
        labelled(
          replaySvg,
          `REPLAYED — ${parity.foregroundParityPercent.toFixed(4)}% foreground parity`,
        ),
      ],
      { gap: 24, normalizeSize: false },
    ),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
}, 120_000)
