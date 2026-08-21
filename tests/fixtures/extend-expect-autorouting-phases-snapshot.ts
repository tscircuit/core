import { type MatcherResult, expect } from "bun:test"
import * as fs from "node:fs"
import * as path from "node:path"
import { convertSrjToGraphicsObject } from "@tscircuit/capacity-autorouter"
import { getSvgFromGraphicsObject } from "graphics-debug"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import type { AutoroutingPhaseIo } from "tests/fixtures/create-autorouting-phase-io-stack"
import { calculateAutoroutingPhaseSnapshotGrid } from "./calculate-autorouting-phase-snapshot-grid"
import { toMatchSvgSnapshot } from "./extend-expect-any-svg"
import { splitAutoroutingPhaseSnapshotPanelsIntoRows } from "./split-autorouting-phase-snapshot-panels-into-rows"

const PANEL_WIDTH = 800
const PANEL_HEIGHT = 636
const GRID_GAP = 16

/** Creates a white SVG with exactly the same dimensions as a snapshot panel. */
const createBlankPanelSvg = () => `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${PANEL_WIDTH}"
  height="${PANEL_HEIGHT}"
  viewBox="0 0 ${PANEL_WIDTH} ${PANEL_HEIGHT}"
>
  <rect width="${PANEL_WIDTH}" height="${PANEL_HEIGHT}" fill="#fff" />
</svg>`

const createPanelLabelSvg = (label: string) => `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="800"
  height="36"
  viewBox="0 0 800 36"
>
  <rect x="0" y="0" width="800" height="36" fill="#121212" />
  <text
    x="400"
    y="23"
    fill="#f4f4f4"
    font-family="Arial, sans-serif"
    font-size="18"
    font-weight="700"
    text-anchor="middle"
  >${label}</text>
</svg>`

function createLabeledSrjSvg(label: string, srj: SimpleRouteJson) {
  const srjSvg = getSvgFromGraphicsObject(
    convertSrjToGraphicsObject(srj as any),
    {
      backgroundColor: "#fff",
      hideInlineLabels: true,
      svgHeight: 600,
      svgWidth: 800,
    },
  )

  return stackSvgsVertically([createPanelLabelSvg(label), srjSvg], {
    gap: 0,
    normalizeSize: false,
  })
}

/**
 * Builds the full routed state after a phase. Some autorouters return only the
 * traces routed by the current phase, while others also return preloaded traces.
 */
function getEndSrjWithPreloadedTraces(
  startSrj: SimpleRouteJson | undefined,
  endSrj: SimpleRouteJson,
): SimpleRouteJson {
  const endTraces = endSrj.traces ?? []
  const outputOrReplacedTraceIds = new Set(
    endTraces.flatMap((trace) =>
      [trace.pcb_trace_id, trace.__replaces_pcb_trace_id].filter(
        (traceId) => traceId !== undefined,
      ),
    ),
  )
  const preloadedTraces = (startSrj?.traces ?? []).filter(
    (trace) => !outputOrReplacedTraceIds.has(trace.pcb_trace_id),
  )

  return {
    ...endSrj,
    traces: [...preloadedTraces, ...endTraces],
  }
}

function getAutoroutingPhasesSvg({
  autoroutingPhaseIoStack,
  snapshotName,
  fullCircuitSvg,
}: {
  autoroutingPhaseIoStack: AutoroutingPhaseIo[]
  snapshotName: string
  fullCircuitSvg?: string
}) {
  const phasePanelPairs = autoroutingPhaseIoStack.map((phase, index) => {
    const phaseNumber = index + 1
    let startPanelSvg = createBlankPanelSvg()
    let endPanelSvg = createBlankPanelSvg()

    if (phase.startSimpleRouteJson) {
      const srj = phase.startSimpleRouteJson
      startPanelSvg = createLabeledSrjSvg(
        `AUTOROUTING PHASE ${phaseNumber} START: ${srj.connections.length} CONNECTIONS, ${
          srj.traces?.length ?? 0
        } TRACES`,
        srj,
      )
    }

    if (phase.endSimpleRouteJson) {
      const srj = getEndSrjWithPreloadedTraces(
        phase.startSimpleRouteJson,
        phase.endSimpleRouteJson,
      )
      endPanelSvg = createLabeledSrjSvg(
        `AUTOROUTING PHASE ${phaseNumber} END: ${srj.connections.length} CONNECTIONS, ${
          srj.traces?.length ?? 0
        } TRACES`,
        srj,
      )
    }

    return [startPanelSvg, endPanelSvg]
  })
  const panelSvgs = phasePanelPairs.flat()
  let panelCount = autoroutingPhaseIoStack.length * 2
  if (fullCircuitSvg) {
    panelSvgs.push(fullCircuitSvg, createBlankPanelSvg())
    panelCount += 1
  }
  const { columnCount } = calculateAutoroutingPhaseSnapshotGrid({
    panelCount,
    panelWidth: PANEL_WIDTH,
    panelHeight: PANEL_HEIGHT,
    gap: GRID_GAP,
  })
  const panelRows = splitAutoroutingPhaseSnapshotPanelsIntoRows({
    panels: panelSvgs,
    columnCount,
    createBlankPanel: createBlankPanelSvg,
  })
  const rowSvgs = panelRows.map((row) =>
    stackSvgsHorizontally(row, {
      gap: GRID_GAP,
      normalizeSize: false,
    }),
  )

  return stackSvgsVertically(rowSvgs, {
    gap: GRID_GAP,
    normalizeSize: false,
    rootAttributes: {
      "data-testid": `${snapshotName}-autorouting-srj-stack`,
    },
  })
}

expect.extend({
  async toMatchAutoroutingPhaseIoStackSnapshot(
    this: any,
    received: unknown,
    ...args: any[]
  ): Promise<MatcherResult> {
    const autoroutingPhaseIoStack = (await received) as AutoroutingPhaseIo[]
    if (autoroutingPhaseIoStack.length === 0) {
      return {
        message: () => "Expected at least one autorouting phase SRJ",
        pass: false,
      }
    }

    const circuit = args[2] as { getCircuitJson(): any[] } | undefined

    let fullCircuitSvg: string | undefined
    if (circuit) {
      const circuitJson = circuit.getCircuitJson()
      const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
        circuitJson,
      })
      const pcbTraces = circuitJson.filter((e: any) => e.type === "pcb_trace")
      simpleRouteJson.traces = pcbTraces as SimplifiedPcbTrace[]

      fullCircuitSvg = createLabeledSrjSvg(
        `FULL ROUTED CIRCUIT: ${simpleRouteJson.connections.length} CONNECTIONS, ${pcbTraces.length} TRACES`,
        simpleRouteJson,
      )
    }
    const svg = getAutoroutingPhasesSvg({
      autoroutingPhaseIoStack,
      snapshotName: args[1],
      fullCircuitSvg,
    })
    const testPath = args[0].replace(/\.test\.tsx?$/, "")
    const snapshotDir = path.join(path.dirname(testPath), "__snapshots__")
    const filePath = path.join(snapshotDir, `${args[1]}.snap.svg`)
    const updateSnapshot =
      process.argv.includes("--update-snapshots") ||
      process.argv.includes("-u") ||
      Boolean(process.env.BUN_UPDATE_SNAPSHOTS)
    const forceUpdateSnapshot =
      process.argv.includes("--force-update-snapshots") ||
      process.argv.includes("-f") ||
      Boolean(process.env.BUN_FORCE_UPDATE_SNAPSHOTS)

    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true })
    }

    if (!fs.existsSync(filePath) || forceUpdateSnapshot) {
      console.log("Creating snapshot at", filePath)
      fs.writeFileSync(filePath, svg)
      return {
        message: () => `Snapshot created at ${filePath}`,
        pass: true,
      }
    }

    if (updateSnapshot) {
      console.log("Updating snapshot at", filePath)
      fs.writeFileSync(filePath, svg)
      return {
        message: () => `Snapshot updated at ${filePath}`,
        pass: true,
      }
    }

    return toMatchSvgSnapshot.call(this, svg, args[0], args[1], {
      diffThresholdPercent: args[3]?.diffThresholdPercent ?? 0.01,
    })
  },
})

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchAutoroutingPhaseIoStackSnapshot(
      testPath: string,
      snapshotName: string,
      circuit?: { getCircuitJson(): any[] },
      options?: { diffThresholdPercent?: number },
    ): Promise<MatcherResult>
  }
}
