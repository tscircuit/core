import { expect, type MatcherResult } from "bun:test"
import * as fs from "node:fs"
import * as path from "node:path"
import looksSame from "looks-same"

const DIFF_THRESHOLD_PERCENT = 1 // only update snapshot if >1% difference

async function toMatchSvgSnapshot(
  this: any,
  received: string,
  testPathOriginal: string,
  svgName?: string,
): Promise<MatcherResult> {
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
    fs.writeFileSync(filePath, received)
    return {
      message: () => `Snapshot created at ${filePath}`,
      pass: true,
    }
  }

  const existingSnapshot = fs.readFileSync(filePath, "utf-8")

  const result: any = await looksSame(
    Buffer.from(received),
    Buffer.from(existingSnapshot),
    {
      strict: false,
      tolerance: 2,
      shouldCluster: true,
      clustersSize: 10,
    },
  )

  const totalPixels =
    result.metaInfo.refImg.size.width * result.metaInfo.refImg.size.height
  const diffPixels = result.diffClusters.reduce(
    (sum: number, cluster: any) =>
      sum + (cluster.right - cluster.left) * (cluster.bottom - cluster.top),
    0,
  )
  const diffPercent = (diffPixels / totalPixels) * 100

  if (updateSnapshot) {
    if (result.equal || diffPercent <= DIFF_THRESHOLD_PERCENT) {
      return {
        message: () => "Snapshot matches",
        pass: true,
      }
    }
    console.log("Updating snapshot at", filePath)
    fs.writeFileSync(filePath, received)
    return {
      message: () => `Snapshot updated at ${filePath}`,
      pass: true,
    }
  }

  if (result.equal || diffPercent <= DIFF_THRESHOLD_PERCENT) {
    return {
      message: () => "Snapshot matches",
      pass: true,
    }
  }

  const diffPath = filePath.replace(".snap.svg", ".diff.png")
  await looksSame.createDiff({
    reference: Buffer.from(existingSnapshot),
    current: Buffer.from(received),
    diff: diffPath,
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
