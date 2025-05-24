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

async function saveSnapshotOfSoup({
  soup,
  testPath,
  mode,
  updateSnapshot,
  options,
}: {
  soup: AnyCircuitElement[]
  testPath: string
  mode: "pcb" | "schematic"
  updateSnapshot: boolean
  options?: any
}): Promise<MatcherResult> {
  testPath = testPath.replace(/\.test\.tsx?$/, "")
  const snapshotDir = path.join(path.dirname(testPath || ""), "__snapshots__")
  const snapshotName = `${path.basename(testPath || "")}-${mode}.snap.svg`
  const filePath = path.join(snapshotDir, snapshotName)

  const svg =
    mode === "pcb"
      ? convertCircuitJsonToPcbSvg(soup)
      : convertCircuitJsonToSchematicSvg(soup, options)

  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true })
  }

  if (!fs.existsSync(filePath) || updateSnapshot) {
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

    return saveSnapshotOfSoup({
      soup: circuitJson,
      testPath: args[0],
      mode: "pcb",
      updateSnapshot:
        process.argv.includes("--update-snapshots") ||
        process.argv.includes("-u") ||
        Boolean(process.env.BUN_UPDATE_SNAPSHOTS),
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

    return saveSnapshotOfSoup({
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
    })
  },

  async toMatch3dSnapshot(
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

    // Convert circuit JSON to 3D SVG
    const svg3d = await convertCircuitJsonToSimple3dSvg(circuitJson, args[1])

    const testPath = args[0]
    const snapshotDir = path.join(path.dirname(testPath || ""), "__snapshots__")
    const snapshotName = `${path.basename(testPath || "")}-3d.snap.svg`
    const filePath = path.join(snapshotDir, snapshotName)

    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true })
    }

    const updateSnapshot =
      process.argv.includes("--update-snapshots") ||
      process.argv.includes("-u") ||
      Boolean(process.env.BUN_UPDATE_SNAPSHOTS)

    if (!fs.existsSync(filePath) || updateSnapshot) {
      console.log("Creating 3D snapshot at", filePath)
      fs.writeFileSync(filePath, svg3d)
      return {
        message: () => `3D snapshot created at ${filePath}`,
        pass: true,
      }
    }

    const existingSnapshot = fs.readFileSync(filePath, "utf-8")

    const result = await looksSame(
      Buffer.from(svg3d),
      Buffer.from(existingSnapshot),
      {
        strict: false,
        tolerance: 2,
      },
    )

    if (result.equal) {
      return {
        message: () => "3D snapshot matches",
        pass: true,
      }
    }

    const diffPath = filePath.replace(".snap.svg", ".diff.png")
    await looksSame.createDiff({
      reference: Buffer.from(existingSnapshot),
      current: Buffer.from(svg3d),
      diff: diffPath,
      highlightColor: "#ff00ff",
    })

    return {
      message: () => `3D snapshot does not match. Diff saved at ${diffPath}`,
      pass: false,
    }
  },
})

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchPcbSnapshot(testPath: string): Promise<MatcherResult>
    toMatchSchematicSnapshot(
      testPath: string,
      options?: Parameters<typeof convertCircuitJsonToSchematicSvg>[1],
    ): Promise<MatcherResult>
    toMatch3dSnapshot(
      testPath: string,
      options?: Parameters<typeof convertCircuitJsonToSimple3dSvg>[1],
    ): Promise<MatcherResult>
  }
}
