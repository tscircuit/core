import { type MatcherResult, expect } from "bun:test"
import * as fs from "node:fs"
import * as path from "node:path"
import { compareImageBuffers, createImageDiff } from "./compare-image-buffers"

const DIFF_THRESHOLD_PERCENT = 1 // only update snapshot if >1% difference

export async function toMatchSvgSnapshot(
  this: any,
  received: string | Promise<string>,
  testPathOriginal: string,
  svgName?: string,
  options?: { diffThresholdPercent?: number },
): Promise<MatcherResult> {
  const svg = await received
  const testPath = testPathOriginal.replace(/\.test\.tsx?$/, "")
  const snapshotDir = path.join(path.dirname(testPath), "__snapshots__")
  const snapshotName = svgName
    ? `${svgName}.snap.svg`
    : `${path.basename(testPath)}.snap.svg`
  const filePath = path.join(snapshotDir, snapshotName)

  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true })
  }

  const updateSnapshot =
    process.argv.includes("--update-snapshots") ||
    process.argv.includes("-u") ||
    Boolean(process.env.BUN_UPDATE_SNAPSHOTS)

  const fileExists = fs.existsSync(filePath)

  if (!fileExists) {
    console.log("Writing snapshot to", filePath)
    fs.writeFileSync(filePath, svg)
    return {
      message: () => `Snapshot created at ${filePath}`,
      pass: true,
    }
  }

  const existingSnapshot = fs.readFileSync(filePath, "utf-8")

  const result = await compareImageBuffers(
    Buffer.from(svg),
    Buffer.from(existingSnapshot),
    {
      strict: false,
      tolerance: 2,
    },
  )

  const totalPixels = result.totalPixels ?? 1
  const diffPixels = result.differentPixels ?? 0
  const diffPercent = (diffPixels / totalPixels) * 100
  const diffThresholdPercent =
    options?.diffThresholdPercent ?? DIFF_THRESHOLD_PERCENT

  if (updateSnapshot) {
    if (result.equal || diffPercent <= diffThresholdPercent) {
      return {
        message: () => "Snapshot matches",
        pass: true,
      }
    }
    console.log("Updating snapshot at", filePath)
    fs.writeFileSync(filePath, svg)
    return {
      message: () => `Snapshot updated at ${filePath}`,
      pass: true,
    }
  }

  if (result.equal || diffPercent <= diffThresholdPercent) {
    return {
      message: () => "Snapshot matches",
      pass: true,
    }
  }

  const diffPath = filePath.replace(".snap.svg", ".diff.png")
  await createImageDiff({
    reference: Buffer.from(existingSnapshot),
    current: Buffer.from(svg),
    diffPath,
    highlightColor: "#ff00ff",
  })

  return {
    message: () =>
      `Snapshot does not match (diff ${diffPercent.toFixed(2)}%). Diff saved at ${diffPath}`,
    pass: false,
  }
}

expect.extend({
  toMatchSvgSnapshot: toMatchSvgSnapshot as any,
})

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchSvgSnapshot(
      testPath: string,
      svgName?: string,
    ): Promise<MatcherResult>
  }
}
