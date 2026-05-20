import { type MatcherResult, expect } from "bun:test"
import { convertSrjToGraphicsObject } from "@tscircuit/capacity-autorouter"
import { getSvgFromGraphicsObject } from "graphics-debug"
import type { AutoroutingPhaseIo } from "tests/fixtures/create-autorouting-phase-io-stack"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/public-exports"
import { convertPcbTraceToSimplifiedPcbTrace } from "lib/components/primitive-components/Group/region-replacement"
import * as fs from "node:fs"
import * as path from "node:path"
import { stackSvgsVertically } from "stack-svgs"
import looksSame from "looks-same"

interface AutoroutingPhaseSnapshotOptions {
  finalBoardCircuit?: unknown
}

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

function getAutoroutingPhasesSvg({
  autoroutingPhaseIoStack,
  snapshotName,
  finalSimpleRouteJson,
}: {
  autoroutingPhaseIoStack: AutoroutingPhaseIo[]
  snapshotName: string
  finalSimpleRouteJson?: SimpleRouteJson | null
}) {
  const phaseSvgs = autoroutingPhaseIoStack
    .flatMap((phase, index) => {
      const phaseNumber = index + 1
      const phaseSvgs: string[] = []

      if (phase.startSimpleRouteJson) {
        const srj = phase.startSimpleRouteJson
        phaseSvgs.push(
          createLabeledSrjSvg(
            `AUTOROUTING PHASE ${phaseNumber} START: ${srj.connections.length} CONNECTIONS, ${
              srj.traces?.length ?? 0
            } TRACES`,
            srj,
          ),
        )
      }

      if (phase.endSimpleRouteJson) {
        const srj = phase.endSimpleRouteJson
        phaseSvgs.push(
          createLabeledSrjSvg(
            `AUTOROUTING PHASE ${phaseNumber} END: ${srj.connections.length} CONNECTIONS, ${
              srj.traces?.length ?? 0
            } TRACES`,
            srj,
          ),
        )
      }

      return phaseSvgs
    })
    .reverse()

  if (finalSimpleRouteJson) {
    phaseSvgs.unshift(
      createLabeledSrjSvg(
        `FINAL ROUTED PCB TRACES: ${
          finalSimpleRouteJson.traces?.length ?? 0
        } TRACES`,
        finalSimpleRouteJson,
      ),
    )
  }

  return stackSvgsVertically(phaseSvgs, {
    gap: 16,
    normalizeSize: false,
    rootAttributes: {
      "data-testid": `${snapshotName}-autorouting-srj-stack`,
    },
  })
}

function getFinalSimpleRouteJson(circuit: any): SimpleRouteJson | null {
  if (!circuit?.db) return null
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })
  return {
    ...simpleRouteJson,
    traces: circuit.db.pcb_trace
      .list()
      .map(convertPcbTraceToSimplifiedPcbTrace),
  }
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

    const svg = getAutoroutingPhasesSvg({
      autoroutingPhaseIoStack,
      snapshotName: args[1],
      finalSimpleRouteJson: getFinalSimpleRouteJson(args[2]?.finalBoardCircuit),
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

    const existingSnapshot = fs.readFileSync(filePath, "utf-8")
    const result: any = await looksSame(
      Buffer.from(svg),
      Buffer.from(existingSnapshot),
      {
        strict: true,
        shouldCluster: true,
        clustersSize: 10,
      },
    )

    if (result.equal) {
      return {
        message: () => "Snapshot matches",
        pass: true,
      }
    }

    const diffPath = filePath.replace(".snap.svg", ".diff.png")
    await looksSame.createDiff({
      reference: Buffer.from(existingSnapshot),
      current: Buffer.from(svg),
      diff: diffPath,
      highlightColor: "#ff00ff",
    })

    return {
      message: () => `Snapshot does not match. Diff saved at ${diffPath}`,
      pass: false,
    }
  },
})

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchAutoroutingPhaseIoStackSnapshot(
      testPath: string,
      snapshotName: string,
      options?: AutoroutingPhaseSnapshotOptions,
    ): Promise<MatcherResult>
  }
}
