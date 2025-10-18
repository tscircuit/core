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
import {
  renderGLTFToPNGBufferFromGLBBuffer,
  bufferFromDataURI,
  createSceneFromGLTF,
  decodeImageFromBuffer,
  computeWorldAABB,
  pureImageFactory,
  renderSceneFromGLTF,
  encodePNGToBuffer,
} from "poppygl"

const ACCEPTABLE_DIFF_PERCENTAGE = 7.0

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
  const ext = mode === "simple-3d" ? "png" : "svg"
  const snapshotName = `${path.basename(testPath || "")}-${mode}.snap.${ext}`
  const filePath = path.join(snapshotDir, snapshotName)

  let content: Buffer | string
  switch (mode) {
    case "pcb":
      content = convertCircuitJsonToPcbSvg(soup, options)
      break
    case "schematic":
      content = convertCircuitJsonToSchematicSvg(soup, options)
      break
    case "simple-3d": {
      // Convert circuit-json to glTF/GLB, then render to PNG with poppygl
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
      if (process.env.SAVE_3D_DEBUG_SNAPSHOT === "1") {
        const debugPath = filePath.replace(/\.png$/, ".glb")
        fs.writeFileSync(debugPath, glbBuffer)
      }
      content = Buffer.isBuffer(png) ? png : Buffer.from(png)
      break
    }
  }

  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true })
  }

  if (!fs.existsSync(filePath) || forceUpdateSnapshot) {
    console.log("Creating snapshot at", filePath)
    fs.writeFileSync(filePath, content)
    return {
      message: () => `Snapshot created at ${filePath}`,
      pass: true,
    }
  }

  const existingSnapshot = fs.readFileSync(filePath)

  const currentBuffer = Buffer.isBuffer(content)
    ? content
    : Buffer.from(content)

  if (mode === "simple-3d") {
    // For 3D PNG snapshots, allow up to ACCEPTABLE_DIFF_PERCENTAGE of pixels to differ
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

    // Use percentage from looks-same (backed by resemblejs) when available
    const mismatchRaw =
      lsResult?.misMatchPercentage ?? lsResult?.rawMisMatchPercentage

    let diffPercentage =
      mismatchRaw != null ? Number(mismatchRaw) : Number.POSITIVE_INFINITY

    if (!Number.isFinite(diffPercentage)) {
      try {
        const refImg = await decodeImageFromBuffer(
          existingSnapshot,
          "image/png",
        )
        const curImg = await decodeImageFromBuffer(currentBuffer, "image/png")
        if (
          refImg?.width === curImg?.width &&
          refImg?.height === curImg?.height
        ) {
          const totalPixels = refImg.width * refImg.height
          let different = 0
          const ref = refImg.data
          const cur = curImg.data
          // RGBA stride = 4
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
          ? `Snapshot differs by ${diffPercentage.toFixed(
              2,
            )}% (> ${ACCEPTABLE_DIFF_PERCENTAGE}%). Diff saved at ${diffPath}`
          : `Snapshot differs (percentage unavailable). Diff saved at ${diffPath}`,
      pass: false,
    }
  }

  // Default comparison for SVG (and fallback)
  const result = await looksSame(currentBuffer, existingSnapshot, {
    strict: false,
    tolerance: 2,
  })

  if (result.equal) {
    return {
      message: () => "Snapshot matches",
      pass: true,
    }
  }

  if (!result.equal && updateSnapshot) {
    console.log("Updating snapshot at", filePath)
    fs.writeFileSync(filePath, content)
    return {
      message: () => `Snapshot updated at ${filePath}`,
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
    toMatchPcbSnapshot(
      testPath: string,
      options?: Parameters<typeof convertCircuitJsonToPcbSvg>[1],
    ): Promise<MatcherResult>
    toMatchSchematicSnapshot(
      testPath: string,
      options?: Parameters<typeof convertCircuitJsonToSchematicSvg>[1],
    ): Promise<MatcherResult>
    toMatchSimple3dSnapshot(
      testPath: string,
      options?: any,
    ): Promise<MatcherResult>
  }
}
