import { type MatcherResult, expect } from "bun:test"
import { convertSrjToGraphicsObject } from "@tscircuit/capacity-autorouter"
import { getSvgFromGraphicsObject } from "graphics-debug"
import type { AutoroutingPhaseIo } from "tests/fixtures/create-autorouting-phase-io-stack"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
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
  autoroutingPhaseIoStack,
  snapshotName,
}: {
  autoroutingPhaseIoStack: AutoroutingPhaseIo[]
  snapshotName: string
}) {
  return stackSvgsVertically(
    autoroutingPhaseIoStack
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
      .reverse(),
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

    const phaseSvg = getAutoroutingPhasesSvg({
      autoroutingPhaseIoStack,
      snapshotName: args[1],
    })

    let svg: string
    if (circuit) {
      const circuitJson = circuit.getCircuitJson()
      const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
        circuitJson,
      })
      const pcbTraces = circuitJson.filter((e: any) => e.type === "pcb_trace")
      simpleRouteJson.traces = pcbTraces as SimplifiedPcbTrace[]

      const fullCircuitSvg = createLabeledSrjSvg(
        `FULL ROUTED CIRCUIT: ${simpleRouteJson.connections.length} CONNECTIONS, ${pcbTraces.length} TRACES`,
        simpleRouteJson,
      )

      svg = stackSvgsVertically([fullCircuitSvg, phaseSvg], {
        gap: 16,
        normalizeSize: false,
      })
    } else {
      svg = phaseSvg
    }
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
    toMatchAutoroutingPhaseIoStackSnapshot(
      testPath: string,
      snapshotName: string,
      circuit?: { getCircuitJson(): any[] },
    ): Promise<MatcherResult>
  }
}
