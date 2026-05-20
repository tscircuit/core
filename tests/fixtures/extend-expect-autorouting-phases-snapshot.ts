import { type MatcherResult, expect } from "bun:test"
import { convertSrjToGraphicsObject } from "@tscircuit/capacity-autorouter"
import { getSvgFromGraphicsObject } from "graphics-debug"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import * as fs from "node:fs"
import * as path from "node:path"
import { stackSvgsVertically } from "stack-svgs"

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
  autoroutingEndPhaseStack,
  snapshotName,
}: {
  autoroutingEndPhaseStack: SimpleRouteJson[]
  snapshotName: string
}) {
  return stackSvgsVertically(
    autoroutingEndPhaseStack
      .map((srj, index) => ({ phaseNumber: index + 1, srj }))
      .reverse()
      .map(({ phaseNumber, srj }) =>
        createLabeledSrjSvg(
          `AUTOROUTING PHASE ${phaseNumber} END: ${srj.connections.length} CONNECTIONS, ${
            srj.traces?.length ?? 0
          } TRACES`,
          srj,
        ),
      ),
    {
      gap: 16,
      normalizeSize: false,
      rootAttributes: {
        "data-testid": `${snapshotName}-autorouting-srj-stack`,
      },
    },
  )
}

expect.extend({
  async toMatchAutoroutingEndPhaseStackSnapshot(
    this: any,
    received: unknown,
    ...args: any[]
  ): Promise<MatcherResult> {
    const autoroutingEndPhaseStack = (await received) as SimpleRouteJson[]
    if (autoroutingEndPhaseStack.length === 0) {
      return {
        message: () => "Expected at least one autorouting phase SRJ",
        pass: false,
      }
    }

    const svg = getAutoroutingPhasesSvg({
      autoroutingEndPhaseStack,
      snapshotName: args[1],
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

    return expect(svg).toMatchSvgSnapshot(args[0], args[1])
  },
})

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchAutoroutingEndPhaseStackSnapshot(
      testPath: string,
      snapshotName: string,
    ): Promise<MatcherResult>
  }
}
