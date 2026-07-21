import { type MatcherResult, expect } from "bun:test"
import * as fs from "node:fs"
import * as path from "node:path"
import { cju } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement, PcbBoard } from "circuit-json"
import {
  convertCircuitJsonToGltf,
  getBestCameraPosition,
} from "circuit-json-to-gltf"
import { RootCircuit } from "lib/RootCircuit"
import looksSame from "looks-same"
import {
  type RenderGLTFToPNGFromGLBOptions as PoppyglOptions,
  renderGLTFToPNGFromGLB,
} from "poppygl"

/** [0,1] percentage of the image that is different */
const ACCEPTABLE_DIFF_FRACTION = 0.01

type CameraPosition = [number, number, number]

export type Match3dSnapshotOptions = {
  diffTolerance?: number
  gltf?: Record<string, unknown>
  poppygl?: PoppyglOptions
  camPos?: CameraPosition
  cameraPreset?: "bottom_angled" | "top_down_orthographic"
  snapshotSuffix?: string
}

export async function resolvePoppyglOptions(
  circuitJson: AnyCircuitElement[],
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

  const board = circuitJson.find(
    (element): element is PcbBoard => element.type === "pcb_board",
  )

  const cameraPreset = options?.cameraPreset
  if (cameraPreset) {
    if (!board) {
      throw new Error("Can't use cameraPreset without pcb_board")
    }
    switch (cameraPreset) {
      case "bottom_angled":
        resolvedOpts.camPos = [
          board.width! / 2,
          -(board.width! + board.height!) / 2,
          board.height! / 2,
        ]
        break
      case "top_down_orthographic": {
        const camera = getBestCameraPosition(circuitJson, {
          preset: "top_down",
          ortho: true,
          aspectRatio: resolvedOpts.width! / resolvedOpts.height!,
        })
        // Camera fitting uses PCB bounds. Leave additional room for mechanical
        // geometry, such as an enclosure, that extends beyond the board.
        const mechanicalFramingScale = 1.35
        resolvedOpts.camPos = camera.camPos.map(
          (coordinate, axis) =>
            camera.lookAt[axis] +
            (coordinate - camera.lookAt[axis]) * mechanicalFramingScale,
        ) as CameraPosition
        resolvedOpts.lookAt = camera.lookAt
        resolvedOpts.fov = camera.fov
        break
      }
      default:
        throw new Error(`Unknown camera preset: ${cameraPreset}`)
    }
  }

  if (!resolvedOpts.camPos && board) {
    resolvedOpts.camPos = [
      board.width! / 2,
      (board.width! + board.height!) / 2,
      board.height! / 2,
    ]
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
  const snapshotSuffix = options?.snapshotSuffix
    ? `-${options.snapshotSuffix}`
    : ""
  const snapshotName = `${path.basename(testPath || "")}${snapshotSuffix}-simple-3d.snap.png`
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
  const png = await renderGLTFToPNGFromGLB(glbBuffer, resolvedRenderOpts)
  const content = png

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
  const currentBuffer = Buffer.from(content)

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
