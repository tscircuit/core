import {
  circuitJsonToPcbSvg,
  circuitJsonToSchematicSvg,
  convertCircuitJsonToPcbSvg,
  convertCircuitJsonToSchematicSvg,
} from "circuit-to-svg"
import { it, expect, type CustomMatcher, type MatcherResult } from "bun:test"
import * as fs from "node:fs"
import * as path from "node:path"
import looksSame from "looks-same"
import { RootCircuit } from "lib/RootCircuit"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToSimple3dSvg } from "circuit-json-to-simple-3d"

async function saveSvgSnapshotOfCircuitJson({
  soup,
  testPath,
  mode,
  updateSnapshot,
  forceUpdateSnapshot,
  options,
}: {
  soup: AnyCircuitElement[]
  testPath: string
  mode: "pcb" | "schematic" | "simple-3d"
  updateSnapshot: boolean
  forceUpdateSnapshot: boolean
  options?: any
}): Promise<MatcherResult> {
  testPath = testPath.replace(/\.test\.tsx?$/, "")
  const snapshotDir = path.join(path.dirname(testPath || ""), "__snapshots__")
  const snapshotName = `${path.basename(testPath || "")}-${mode}.snap.svg`
  const filePath = path.join(snapshotDir, snapshotName)

  let svg: string
  switch (mode) {
    case "pcb":
      svg = convertCircuitJsonToPcbSvg(soup)
      break
    case "schematic":
      svg = convertCircuitJsonToSchematicSvg(soup, options)
      break
    case "simple-3d":
      svg = await convertCircuitJsonToSimple3dSvg(soup, options)
      break
  }

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

  const existingSnapshot = fs.readFileSync(filePath, "utf-8")

  const result = await looksSame(
    Buffer.from(svg),
    Buffer.from(existingSnapshot),
    {
      strict: false,
      tolerance: 2,
    },
  )

  if (result.equal) {
    return {
      message: () => "Snapshot matches",
      pass: true,
    }
  }

  if (!result.equal && updateSnapshot) {
    console.log("Updating snapshot at", filePath)
    fs.writeFileSync(filePath, svg)
    return {
      message: () => `Snapshot updated at ${filePath}`,
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
}

expect.extend({
  async toMatchPcbSnapshot(
    this: any,
    received: unknown,
    ...args: any[]
  ): Promise<MatcherResult> {
    let circuitJson: AnyCircuitElement[]
    if (received instanceof RootCircuit) {
      await received.renderUntilSettled()
      circuitJson = await received.getCircuitJson()
    } else {
      circuitJson = received as AnyCircuitElement[]
    }

    return saveSvgSnapshotOfCircuitJson({
      soup: circuitJson,
      testPath: args[0],
      mode: "pcb",
      updateSnapshot:
        process.argv.includes("--update-snapshots") ||
        process.argv.includes("-u") ||
        Boolean(process.env.BUN_UPDATE_SNAPSHOTS),
      forceUpdateSnapshot:
        process.argv.includes("--force-update-snapshots") ||
        process.argv.includes("-f") ||
        Boolean(process.env.BUN_FORCE_UPDATE_SNAPSHOTS),
    })
  },
  async toMatchSchematicSnapshot(
    this: any,
    received: unknown,
    ...args: any[]
  ): Promise<MatcherResult> {
    let circuitJson: AnyCircuitElement[]
    if (received instanceof RootCircuit) {
      await received.renderUntilSettled()
      circuitJson = await received.getCircuitJson()
    } else {
      circuitJson = received as AnyCircuitElement[]
    }

    return saveSvgSnapshotOfCircuitJson({
      soup: circuitJson,
      testPath: args[0],
      mode: "schematic",
      options: args[1] ?? {
        grid: {
          cellSize: 1,
          labelCells: true,
        },
      },
      updateSnapshot:
        process.argv.includes("--update-snapshots") ||
        process.argv.includes("-u") ||
        Boolean(process.env.BUN_UPDATE_SNAPSHOTS),
      forceUpdateSnapshot:
        process.argv.includes("--force-update-snapshots") ||
        process.argv.includes("-f") ||
        Boolean(process.env.BUN_FORCE_UPDATE_SNAPSHOTS),
    })
  },

  async toMatchSimple3dSnapshot(
    this: any,
    received: unknown,
    ...args: any[]
  ): Promise<MatcherResult> {
    let circuitJson: AnyCircuitElement[]
    if (received instanceof RootCircuit) {
      await received.renderUntilSettled()
      circuitJson = await received.getCircuitJson()
    } else {
      circuitJson = received as AnyCircuitElement[]
    }

    return saveSvgSnapshotOfCircuitJson({
      soup: circuitJson,
      testPath: args[0],
      mode: "simple-3d",
      options: args[1] ?? {
        grid: {
          cellSize: 1,
          labelCells: true,
        },
      },
      updateSnapshot:
        process.argv.includes("--update-snapshots") ||
        process.argv.includes("-u") ||
        Boolean(process.env.BUN_UPDATE_SNAPSHOTS),
      forceUpdateSnapshot:
        process.argv.includes("--force-update-snapshots") ||
        process.argv.includes("-f") ||
        Boolean(process.env.BUN_FORCE_UPDATE_SNAPSHOTS),
    })
  },
})

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchPcbSnapshot(testPath: string): Promise<MatcherResult>
    toMatchSchematicSnapshot(
      testPath: string,
      options?: Parameters<typeof convertCircuitJsonToSchematicSvg>[1],
    ): Promise<MatcherResult>
    toMatchSimple3dSnapshot(
      testPath: string,
      options?: Parameters<typeof convertCircuitJsonToSimple3dSvg>[1],
    ): Promise<MatcherResult>
  }
}
