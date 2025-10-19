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
import { cju } from "@tscircuit/circuit-json-util"

const ACCEPTABLE_DIFF_PERCENTAGE = 7.0

type CameraPosition = [number, number, number]

type PoppyglOptions = {
  camPos?: CameraPosition
  cameraPreset?: string
} & Record<string, unknown>

type Simple3dAnglePreset =
  | "angle1"
  | "angle2"
  | "left"
  | "right"
  | "left-raised"
  | "right-raised"

export type CameraPreset =
  | "bottom_angled"
  | "bottom-angled"
  | "top_angled"
  | "top-angled"
  | "top_left"
  | "top-left"
  | "top_right"
  | "top-right"
  | "left"
  | "right"
  | "left_raised"
  | "left-raised"
  | "right_raised"
  | "right-raised"
  | "angle1"
  | "angle2"
  | "default"
  | (string & {})

export type Match3dSnapshotOptions = {
  gltf?: Record<string, unknown>
  poppygl?: PoppyglOptions
  camPos?: CameraPosition
  cameraPreset?: CameraPreset
}

type CameraPresetResolverContext = {
  soup: AnyCircuitElement[]
  preset: string
}

type CameraPresetResolver = (
  context: CameraPresetResolverContext,
) => Promise<CameraPosition | undefined>

const anglePresetAliases: Record<string, Simple3dAnglePreset> = {
  angle1: "angle1",
  angle2: "angle2",
  left: "left",
  right: "right",
  "left-raised": "left-raised",
  "right-raised": "right-raised",
  left_raised: "left-raised",
  right_raised: "right-raised",
  top_angled: "angle1",
  "top-angled": "angle1",
  top_left: "angle1",
  "top-left": "angle1",
  top_right: "angle2",
  "top-right": "angle2",
  default: "angle1",
}

type OrbitPosition = { x: number; y: number; z: number }

function toNumeric(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function computeOrbitPosition({
  cx,
  cz,
  dist,
  anglePreset,
}: {
  cx: number
  cz: number
  dist: number
  anglePreset: Simple3dAnglePreset
}): OrbitPosition {
  switch (anglePreset) {
    case "angle1":
      return { x: cx - dist, y: dist, z: cz - dist }
    case "angle2":
      return { x: cx + dist, y: dist, z: cz - dist }
    case "left":
      return { x: cx - dist, y: 0, z: cz }
    case "right":
      return { x: cx + dist, y: 0, z: cz }
    case "left-raised":
      return { x: cx - dist, y: dist, z: cz }
    case "right-raised":
      return { x: cx + dist, y: dist, z: cz }
    default:
      return { x: cx - dist, y: dist, z: cz - dist }
  }
}

function getDefaultCameraForPcbBoard(
  pcbBoard: any,
  anglePreset: Simple3dAnglePreset,
): OrbitPosition {
  const w = toNumeric(pcbBoard?.width)
  const h = toNumeric(pcbBoard?.height)
  const cx = toNumeric(pcbBoard?.center?.x)
  const cz = toNumeric(pcbBoard?.center?.y)
  const boardSize = Math.max(w, h, 5)
  const dist = boardSize * 1.5
  return computeOrbitPosition({ cx, cz, dist, anglePreset })
}

function getDefaultCameraForComponents(
  components: any[],
  anglePreset: Simple3dAnglePreset,
): OrbitPosition {
  if (components.length === 0) {
    return { x: 10, y: 10, z: 10 }
  }

  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minZ = Number.POSITIVE_INFINITY
  let maxZ = Number.NEGATIVE_INFINITY

  for (const comp of components) {
    const width = toNumeric(comp?.width)
    const height = toNumeric(comp?.height)
    const centerX = toNumeric(comp?.center?.x)
    const centerZ = toNumeric(comp?.center?.y)
    const halfWidth = width / 2
    const halfHeight = height / 2

    minX = Math.min(minX, centerX - halfWidth)
    maxX = Math.max(maxX, centerX + halfWidth)
    minZ = Math.min(minZ, centerZ - halfHeight)
    maxZ = Math.max(maxZ, centerZ + halfHeight)
  }

  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(minZ) ||
    !Number.isFinite(maxZ)
  ) {
    return { x: 10, y: 10, z: 10 }
  }

  const cx = (minX + maxX) / 2
  const cz = (minZ + maxZ) / 2
  const w = maxX - minX
  const h = maxZ - minZ
  const componentSize = Math.max(w, h, 5)
  const dist = componentSize * 1.5
  return computeOrbitPosition({ cx, cz, dist, anglePreset })
}

async function getSceneCameraPosition({
  soup,
  anglePreset,
}: {
  soup: AnyCircuitElement[]
  anglePreset?: Simple3dAnglePreset
}): Promise<CameraPosition | undefined> {
  try {
    const db = cju(soup)
    const preset = anglePreset ?? "angle1"
    const pcbBoard = db.pcb_board.list()[0]
    if (pcbBoard) {
      const position = getDefaultCameraForPcbBoard(pcbBoard, preset)
      return [position.x, position.y, position.z]
    }

    const pcbComponents = db.pcb_component.list()
    const position = getDefaultCameraForComponents(pcbComponents, preset)
    return [position.x, position.y, position.z]
  } catch (error) {
    console.warn(
      `Failed to derive camera position from circuit json: ${(error as Error).message}`,
    )
    return undefined
  }
}

const cameraPresetResolvers: Record<string, CameraPresetResolver> = {
  bottom_angled: async ({ soup }) => {
    const base = await getSceneCameraPosition({ soup, anglePreset: "angle1" })
    if (!base) return undefined
    const [x, y, z] = base
    const fallback = 10
    const scaledX = x === 0 ? -fallback : x * (4 / 3)
    const scaledZ = z === 0 ? -fallback : z * 2
    const scaledY = y === 0 ? -fallback : -Math.abs(y) * 2
    return [scaledX, scaledY, scaledZ]
  },
  "bottom-angled": async (context) =>
    cameraPresetResolvers.bottom_angled(context),
}

async function resolveCameraPresetCamPos(
  context: CameraPresetResolverContext,
): Promise<CameraPosition | undefined> {
  const normalized = context.preset.toLowerCase()
  const directResolver = cameraPresetResolvers[normalized]
  if (directResolver) {
    return directResolver(context)
  }

  const anglePreset = anglePresetAliases[normalized]
  if (anglePreset) {
    return getSceneCameraPosition({ soup: context.soup, anglePreset })
  }

  if ((normalized as string).includes("angle")) {
    const presetKey = normalized.replace(
      /-/g,
      "_",
    ) as keyof typeof anglePresetAliases
    const alias = anglePresetAliases[presetKey]
    if (alias) {
      return getSceneCameraPosition({ soup: context.soup, anglePreset: alias })
    }
  }

  return undefined
}

export async function resolvePoppyglOptions(
  soup: AnyCircuitElement[],
  options?: Match3dSnapshotOptions,
): Promise<PoppyglOptions> {
  const base: PoppyglOptions = {
    width: 1024,
    height: 1024,
    ambient: 0.2,
    gamma: 2.2,
    ...(options?.poppygl ?? {}),
  }

  const explicitCamPos = options?.camPos ?? base.camPos
  if (explicitCamPos) {
    base.camPos = explicitCamPos
  }

  const cameraPreset = options?.cameraPreset ?? base.cameraPreset
  if (cameraPreset) {
    base.cameraPreset = cameraPreset
  }

  if (!base.camPos && cameraPreset) {
    const resolved = await resolveCameraPresetCamPos({
      soup,
      preset: cameraPreset,
    })
    if (resolved) {
      base.camPos = resolved
    }
  }

  return base
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

  const gltfModule: any = await import("circuit-json-to-gltf")
  const toGltf =
    gltfModule.convertCircuitJsonToGltf ?? gltfModule.circuitJsonToGltf
  if (!toGltf) {
    throw new Error(
      "circuit-json-to-gltf does not export convertCircuitJsonToGltf or circuitJsonToGltf",
    )
  }

  const gltfOrGlb = await toGltf(soup, {
    boardTextureResolution: 0,
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
      Boolean(process.env.BUN_FORCE_UPDATE_SNAPSHOTS),
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
