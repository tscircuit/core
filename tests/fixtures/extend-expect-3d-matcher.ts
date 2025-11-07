import { expect, type MatcherResult } from "bun:test"
import type { AnyCircuitElement, PcbBoard } from "circuit-json"
import * as fs from "node:fs"
import * as path from "node:path"
import looksSame from "looks-same"
import { RootCircuit } from "lib/RootCircuit"
import {
  renderGLTFToPNGBufferFromGLBBuffer,
  decodeImageFromBuffer,
  type RenderGLTFToPNGBufferFromGLBBufferOptions as PoppyglOptions,
} from "poppygl"
import { convertCircuitJsonToGltf } from "circuit-json-to-gltf"
import { cju } from "@tscircuit/circuit-json-util"

/** [0,1] percentage of the image that is different */
const ACCEPTABLE_DIFF_FRACTION = 0.01

type CameraPosition = [number, number, number]

export type Match3dSnapshotOptions = {
  diffTolerance?: number
  gltf?: Record<string, unknown>
  poppygl?: PoppyglOptions
  camPos?: CameraPosition
  cameraPreset?: "bottom_angled"
}

export async function resolvePoppyglOptions(
  soup: AnyCircuitElement[],
  options?: Match3dSnapshotOptions,
): Promise<PoppyglOptions> {
  const resolvedOpts: PoppyglOptions = {
    width: 1024,
    height: 1024,
    lookAt: [0, 0, 0],
    backgroundColor: [0, 0, 0],
    grid: {
      cellSize: 1,
      color: [128, 128, 128],
      infiniteGrid: true,
    },
    ...(options?.poppygl ?? {}),
  }

  const explicitCamPos = options?.camPos ?? resolvedOpts.camPos
  if (explicitCamPos) {
    resolvedOpts.camPos = explicitCamPos
  }

  const board = soup.find(
    (element): element is PcbBoard => element.type === "pcb_board",
  )

  const cameraPreset = options?.cameraPreset
  if (cameraPreset) {
    if (!board) {
      throw new Error("Can't use cameraPreset without pcb_board")
    }
    // Handle outlined boards differently
    if ((board as any).shape === "polygon" && board.outline) {
      // Calculate bounds from outline for camera positioning
      const xVals = board.outline.map((p) => p.x)
      const yVals = board.outline.map((p) => p.y)
      const outlineWidth = Math.max(...xVals) - Math.min(...xVals)
      const outlineHeight = Math.max(...yVals) - Math.min(...yVals)

      switch (cameraPreset) {
        case "bottom_angled":
          resolvedOpts.camPos = [
            outlineWidth / 2,
            -(outlineWidth + outlineHeight) / 2,
            outlineHeight / 2,
          ]
          break
        default:
          throw new Error(`Unknown camera preset: ${cameraPreset}`)
      }
    } else if (board.width && board.height) {
      switch (cameraPreset) {
        case "bottom_angled":
          resolvedOpts.camPos = [
            board.width / 2,
            -(board.width + board.height) / 2,
            board.height / 2,
          ]
          break
        default:
          throw new Error(`Unknown camera preset: ${cameraPreset}`)
      }
    }
  }

  if (!resolvedOpts.camPos && board) {
    // Handle outlined boards
    if ((board as any).shape === "polygon" && board.outline) {
      // Calculate bounds from outline
      const xVals = board.outline.map((p) => p.x)
      const yVals = board.outline.map((p) => p.y)
      const outlineWidth = Math.max(...xVals) - Math.min(...xVals)
      const outlineHeight = Math.max(...yVals) - Math.min(...yVals)

      resolvedOpts.camPos = [
        outlineWidth / 2,
        (outlineWidth + outlineHeight) / 2,
        outlineHeight / 2,
      ]
    } else if (board.width && board.height) {
      // Rectangular board with width/height
      resolvedOpts.camPos = [
        board.width / 2,
        (board.width + board.height) / 2,
        board.height / 2,
      ]
    }
  }

  return resolvedOpts
}

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
  options?: Match3dSnapshotOptions
}): Promise<MatcherResult> {
  testPath = testPath.replace(/\.test\.tsx?$/, "")
  const snapshotDir = path.join(path.dirname(testPath || ""), "__snapshots__")
  const snapshotName = `${path.basename(testPath || "")}-simple-3d.snap.png`
  const filePath = path.join(snapshotDir, snapshotName)

  const gltfOrGlb = await convertCircuitJsonToGltf(soup, {
    boardTextureResolution: 512,
    includeModels: true,
    showBoundingBoxes: false,
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
  const resolvedRenderOpts = await resolvePoppyglOptions(soup, options)
  const png = await renderGLTFToPNGBufferFromGLBBuffer(
    glbBuffer,
    resolvedRenderOpts,
  )
  const content = Buffer.isBuffer(png) ? png : Buffer.from(png)

  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true })
  }

  if (!fs.existsSync(filePath) || forceUpdateSnapshot) {
    console.log("Writing snapshot at", filePath)
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

  const lsResult = await looksSame(currentBuffer, existingSnapshot, {
    strict: false,
    tolerance: 7,
    ignoreAntialiasing: true,
    antialiasingTolerance: 4,
    shouldCluster: true,
    clustersSize: 10,
    createDiffImage: true,
  })

  if (lsResult.equal) {
    if (forceUpdateSnapshot) {
      console.log("Updating snapshot at", filePath)
      fs.writeFileSync(filePath, content)
      if (process.env.SAVE_3D_DEBUG_SNAPSHOT === "1") {
        const debugPath = filePath.replace(/\.png$/, ".glb")
        fs.writeFileSync(debugPath, glbBuffer)
      }
    }
    return {
      message: () => "Snapshot matches",
      pass: true,
    }
  }

  let areaOfDiffClusters = 0
  for (const cluster of lsResult.diffClusters) {
    areaOfDiffClusters +=
      (cluster.right - cluster.left) * (cluster.bottom - cluster.top)
  }

  /** [0,1] percentage of the image that is different */
  const diffFraction = areaOfDiffClusters / lsResult.totalPixels

  if (diffFraction <= (options?.diffTolerance ?? ACCEPTABLE_DIFF_FRACTION)) {
    return {
      message: () =>
        `Snapshot within acceptable difference (${(diffFraction * 100).toFixed(2)}% <= ${(ACCEPTABLE_DIFF_FRACTION * 100).toFixed(3)}%)`,
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
        `Snapshot updated at ${filePath}(was ${(diffFraction * 100).toFixed(2)}% different)`,
      pass: true,
    }
  }

  const diffPath = filePath.replace(/\.snap\.(svg|png)$/, ".diff.png")
  await lsResult.diffImage.save(diffPath)

  return {
    message: () =>
      `Snapshot differs by ${(diffFraction * 100).toFixed(2)}% (> ${(ACCEPTABLE_DIFF_FRACTION * 100).toFixed(3)}%). Diff saved at ${diffPath}`,
    pass: false,
  }
}

async function match3dSnapshot(
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
      Boolean(process.env.BUN_FORCE_UPDATE_SNAPSHOTS) ||
      Boolean(process.env.FORCE_BUN_UPDATE_SNAPSHOTS),
  })
}

expect.extend({
  async toMatchSimple3dSnapshot(
    this: any,
    received: unknown,
    ...args: any[]
  ): Promise<MatcherResult> {
    return match3dSnapshot(received, ...args)
  },
  async toMatch3dSnapshot(
    this: any,
    received: unknown,
    ...args: any[]
  ): Promise<MatcherResult> {
    return match3dSnapshot(received, ...args)
  },
})

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchSimple3dSnapshot(
      testPath: string,
      options?: Match3dSnapshotOptions,
    ): Promise<MatcherResult>
    toMatch3dSnapshot(
      testPath: string,
      options?: Match3dSnapshotOptions,
    ): Promise<MatcherResult>
  }
}
