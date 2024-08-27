import { expect, type MatcherResult } from "bun:test"
import * as fs from "node:fs"
import * as path from "node:path"
import looksSame from "looks-same"

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

  if (!fs.existsSync(filePath) || updateSnapshot) {
    fs.writeFileSync(filePath, received)
    return {
      message: () => `Snapshot created at ${filePath}`,
      pass: true,
    }
  }

  const existingSnapshot = fs.readFileSync(filePath, "utf-8")

  const result = await looksSame(
    Buffer.from(received),
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
    current: Buffer.from(received),
    diff: diffPath,
    highlightColor: "#ff00ff",
  })

  return {
    message: () => `Snapshot does not match. Diff saved at ${diffPath}`,
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
