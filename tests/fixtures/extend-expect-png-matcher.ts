import { type MatcherResult, expect } from "bun:test"
import * as fs from "node:fs"
import * as path from "node:path"
import { compareImageBuffers, createImageDiff } from "./compare-image-buffers"

/** PNG snapshot matcher following PoppyGL's toMatchPngSnapshot conventions. */
export async function toMatchPngSnapshot(
  receivedMaybePromise: Buffer | Uint8Array | Promise<Buffer | Uint8Array>,
  testPathOriginal: string,
  pngName?: string,
): Promise<MatcherResult> {
  const received = await receivedMaybePromise
  const testPath = testPathOriginal.replace(/\.test\.tsx?$/, "")
  const snapshotDir = path.join(path.dirname(testPath), "__snapshots__")
  const snapshotName = pngName
    ? `${pngName}.snap.png`
    : `${path.basename(testPath)}.snap.png`
  const filePath = path.join(snapshotDir, snapshotName)

  fs.mkdirSync(snapshotDir, { recursive: true })

  const updateSnapshot =
    process.argv.includes("--update-snapshots") ||
    process.argv.includes("-u") ||
    Boolean(process.env.BUN_UPDATE_SNAPSHOTS)
  const forceUpdate = Boolean(process.env.FORCE_BUN_UPDATE_SNAPSHOTS)

  if (!fs.existsSync(filePath)) {
    console.log("Writing PNG snapshot to", filePath)
    fs.writeFileSync(filePath, received)
    return {
      message: () => `PNG snapshot created at ${filePath}`,
      pass: true,
    }
  }

  const existingSnapshot = fs.readFileSync(filePath)
  const result = await compareImageBuffers(existingSnapshot, received, {
    strict: false,
    tolerance: 2,
  })

  if (updateSnapshot || forceUpdate) {
    if (!forceUpdate && result.equal) {
      return {
        message: () => "PNG snapshot matches",
        pass: true,
      }
    }
    console.log("Updating PNG snapshot at", filePath)
    fs.writeFileSync(filePath, received)
    return {
      message: () => `PNG snapshot updated at ${filePath}`,
      pass: true,
    }
  }

  if (result.equal) {
    return {
      message: () => "PNG snapshot matches",
      pass: true,
    }
  }

  const diffPath = filePath.replace(/\.snap\.png$/, ".diff.png")
  await createImageDiff({
    reference: existingSnapshot,
    current: received,
    diffPath,
    highlightColor: "#ff00ff",
    strict: false,
    tolerance: 2,
  })

  return {
    message: () => `PNG snapshot does not match. Diff saved at ${diffPath}`,
    pass: false,
  }
}

expect.extend({
  toMatchPngSnapshot: toMatchPngSnapshot as any,
})

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchPngSnapshot(
      testPath: string,
      pngName?: string,
    ): Promise<MatcherResult>
  }
}
