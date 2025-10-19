import { expect, type MatcherResult } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import * as fs from "node:fs"
import * as path from "node:path"
import looksSame from "looks-same"
import { RootCircuit } from "lib/RootCircuit"
import {
  renderGLTFToPNGBufferFromGLBBuffer,
  decodeImageFromBuffer,
} from "poppygl"

const ACCEPTABLE_DIFF_PERCENTAGE = 7.0

async function save3dSnapshotOfCircuitJson({
  soup,
  testPath,
  updateSnapshot,
  forceUpdateSnapshot,
  options,
}: {
  soup: AnyCircuitElement[]
  testPath: string
  updateSnapshot: boolean
  forceUpdateSnapshot: boolean
  options?: any
}): Promise<MatcherResult> {
  testPath = testPath.replace(/\.test\.tsx?$/, "")
  const snapshotDir = path.join(path.dirname(testPath || ""), "__snapshots__")
  const snapshotName = `${path.basename(testPath || "")}-simple-3d.snap.png`
  const filePath = path.join(snapshotDir, snapshotName)

  const gltfModule: any = await import("circuit-json-to-gltf")
  const toGltf =
    gltfModule.convertCircuitJsonToGltf ?? gltfModule.circuitJsonToGltf
  if (!toGltf) {
    throw new Error(
      "circuit-json-to-gltf does not export convertCircuitJsonToGltf or circuitJsonToGltf",
    )
  }

  const gltfOrGlb = await toGltf(soup, {
    ...(options?.gltf ?? {}),
    format: "glb",
  })

  if (
    !(
      gltfOrGlb instanceof Uint8Array ||
      Buffer.isBuffer(gltfOrGlb) ||
      gltfOrGlb instanceof ArrayBuffer
    )
  ) {
    throw new Error(
      `circuit-json-to-gltf did not produce a GLB file. Snapshots require a GLB. Received type: ${
        (gltfOrGlb as any)?.constructor?.name ?? typeof gltfOrGlb
      }`,
    )
  }

  const glbBuffer = Buffer.isBuffer(gltfOrGlb)
    ? gltfOrGlb
    : Buffer.from(gltfOrGlb as any)
  const resolvedRenderOpts = {
    width: 1024,
    height: 1024,
    ambient: 0.2,
    gamma: 2.2,
    ...(options?.poppygl ?? {}),
  }
  const png = await renderGLTFToPNGBufferFromGLBBuffer(
    glbBuffer,
    resolvedRenderOpts,
  )
  const content = Buffer.isBuffer(png) ? png : Buffer.from(png)

  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true })
  }

  if (!fs.existsSync(filePath) || forceUpdateSnapshot) {
    console.log("Creating snapshot at", filePath)
    fs.writeFileSync(filePath, content)
    if (process.env.SAVE_3D_DEBUG_SNAPSHOT === "1") {
      const debugPath = filePath.replace(/\.png$/, ".glb")
      fs.writeFileSync(debugPath, glbBuffer)
    }
    return {
      message: () => `Snapshot created at ${filePath}`,
      pass: true,
    }
  }

  const existingSnapshot = fs.readFileSync(filePath)
  const currentBuffer = Buffer.isBuffer(content)
    ? content
    : Buffer.from(content)

  const lsResult: any = await looksSame(currentBuffer, existingSnapshot, {
    strict: false,
    tolerance: 2,
  })

  if (lsResult.equal) {
    return {
      message: () => "Snapshot matches",
      pass: true,
    }
  }

  const mismatchRaw =
    lsResult?.misMatchPercentage ?? lsResult?.rawMisMatchPercentage

  let diffPercentage =
    mismatchRaw != null ? Number(mismatchRaw) : Number.POSITIVE_INFINITY

  if (!Number.isFinite(diffPercentage)) {
    try {
      const refImg = await decodeImageFromBuffer(existingSnapshot, "image/png")
      const curImg = await decodeImageFromBuffer(currentBuffer, "image/png")
      if (
        refImg?.width === curImg?.width &&
        refImg?.height === curImg?.height
      ) {
        const totalPixels = refImg.width * refImg.height
        let different = 0
        const ref = refImg.data
        const cur = curImg.data
        for (let i = 0; i < totalPixels; i++) {
          const idx = i * 4
          if (
            ref[idx] !== cur[idx] ||
            ref[idx + 1] !== cur[idx + 1] ||
            ref[idx + 2] !== cur[idx + 2] ||
            ref[idx + 3] !== cur[idx + 3]
          ) {
            different++
          }
        }
        diffPercentage = (different / totalPixels) * 100
      }
    } catch {}
  }

  if (
    Number.isFinite(diffPercentage) &&
    diffPercentage <= ACCEPTABLE_DIFF_PERCENTAGE
  ) {
    return {
      message: () =>
        `Snapshot within acceptable difference (${diffPercentage.toFixed(2)}% <= ${ACCEPTABLE_DIFF_PERCENTAGE}%)`,
      pass: true,
    }
  }

  if (updateSnapshot) {
    console.log("Updating snapshot at", filePath)
    fs.writeFileSync(filePath, content)
    if (process.env.SAVE_3D_DEBUG_SNAPSHOT === "1") {
      const debugPath = filePath.replace(/\.png$/, ".glb")
      fs.writeFileSync(debugPath, glbBuffer)
    }
    return {
      message: () =>
        `Snapshot updated at ${filePath}${
          Number.isFinite(diffPercentage)
            ? ` (was ${diffPercentage.toFixed(2)}% different)`
            : ""
        }`,
      pass: true,
    }
  }

  const diffPath = filePath.replace(/\.snap\.(svg|png)$/, ".diff.png")
  await looksSame.createDiff({
    reference: existingSnapshot,
    current: currentBuffer,
    diff: diffPath,
    highlightColor: "#ff00ff",
  })

  return {
    message: () =>
      Number.isFinite(diffPercentage)
        ? `Snapshot differs by ${diffPercentage.toFixed(2)}% (> ${ACCEPTABLE_DIFF_PERCENTAGE}%). Diff saved at ${diffPath}`
        : `Snapshot differs (percentage unavailable). Diff saved at ${diffPath}`,
    pass: false,
  }
}

expect.extend({
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

    return save3dSnapshotOfCircuitJson({
      soup: circuitJson,
      testPath: args[0],
      options: args[1],
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
    toMatchSimple3dSnapshot(
      testPath: string,
      options?: any,
    ): Promise<MatcherResult>
  }
}
