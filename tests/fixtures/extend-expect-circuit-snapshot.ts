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
      content = convertCircuitJsonToPcbSvg(soup)
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
      const gltfOrGlb = await toGltf(soup, options?.gltf)

      const poppy: any = await import("poppygl")
      const {
        renderGLTFToPNGBufferFromGLBBuffer,
        bufferFromDataURI,
        createSceneFromGLTF,
        decodeImageFromBuffer,
        computeWorldAABB,
        pureImageFactory,
        renderSceneFromGLTF,
        encodePNGToBuffer,
      } = poppy

      // If we got a GLB buffer, render directly
      if (gltfOrGlb instanceof Uint8Array || Buffer.isBuffer(gltfOrGlb)) {
        const glbBuffer = Buffer.isBuffer(gltfOrGlb)
          ? gltfOrGlb
          : Buffer.from(gltfOrGlb)
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

      // Otherwise assume GLTF JSON (object or JSON string)
      const gltfJson =
        typeof gltfOrGlb === "string" ? JSON.parse(gltfOrGlb) : gltfOrGlb

      // Prepare resources; require data: URIs to avoid filesystem/network in tests
      const buffers = await Promise.all(
        (gltfJson.buffers ?? []).map(async (entry: any) => {
          if (!entry?.uri) {
            throw new Error(
              "GLTF buffer without a URI; please configure circuit-json-to-gltf to emit GLB, or ensure buffers use data: URIs.",
            )
          }
          if (!entry.uri.startsWith("data:")) {
            throw new Error(
              `Non-data URI buffer (${entry.uri}) not supported in tests; use GLB or embed resources.`,
            )
          }
          return bufferFromDataURI(entry.uri)
        }),
      )

      const images = await Promise.all(
        (gltfJson.images ?? []).map(async (img: any) => {
          // Case 1: data URI image
          if (typeof img?.uri === "string") {
            if (!img.uri.startsWith("data:")) {
              throw new Error(
                `Non-data URI image (${img.uri}) not supported in tests; use GLB or embed resources.`,
              )
            }
            const data = bufferFromDataURI(img.uri)
            return decodeImageFromBuffer(data, img.mimeType)
          }

          // Case 2: bufferView-backed image
          if (typeof img?.bufferView === "number") {
            const bufferViews = gltfJson.bufferViews ?? []
            const view = bufferViews[img.bufferView]
            if (!view) {
              throw new Error(
                `GLTF image references missing bufferView index ${img.bufferView}`,
              )
            }
            const bufferIndex = view.buffer
            const src = buffers[bufferIndex]
            if (!src) {
              throw new Error(
                `GLTF image bufferView refers to missing buffer index ${bufferIndex}`,
              )
            }
            const byteOffset = view.byteOffset ?? 0
            const byteLength =
              view.byteLength ?? Math.max(0, src.length - byteOffset)
            const slice = src.subarray(byteOffset, byteOffset + byteLength)
            return decodeImageFromBuffer(slice, img.mimeType)
          }

          throw new Error(
            "GLTF image missing 'uri' and 'bufferView'; provide GLB or embed image resources.",
          )
        }),
      )

      const scene = createSceneFromGLTF(gltfJson, { buffers, images })

      const aabb = computeWorldAABB((scene as any)?.drawCalls ?? scene)
      let minX: number,
        minY: number,
        minZ: number,
        maxX: number,
        maxY: number,
        maxZ: number
      if (
        Array.isArray((aabb as any)?.min) &&
        Array.isArray((aabb as any)?.max)
      ) {
        ;[minX, minY, minZ] = (aabb as any).min
        ;[maxX, maxY, maxZ] = (aabb as any).max
      } else {
        ;({ minX, minY, minZ, maxX, maxY, maxZ } = aabb as any)
      }

      const cx = (minX + maxX) / 2
      const cy = (minY + maxY) / 2
      const cz = (minZ + maxZ) / 2
      const dx = maxX - minX || 1
      const dy = maxY - minY || 1
      const dz = maxZ - minZ || 1
      const radius = Math.max(dx, dy, dz) || 1

      const camPos = [cx + radius * 1.2, cy + radius * 1.0, cz + radius * 1.6]
      const lookAt = [cx, cy, cz]

      const renderOpts = {
        width: 1024,
        height: 1024,
        ambient: 0.2,
        gamma: 2.2,
        camPos,
        lookAt,
        ...(options?.poppygl ?? {}),
      }

      const { bitmap } = renderSceneFromGLTF(
        scene,
        renderOpts,
        pureImageFactory,
      )

      if (process.env.SAVE_3D_DEBUG_SNAPSHOT === "1") {
        const debugPath = filePath.replace(/\.png$/, ".gltf")
        fs.writeFileSync(
          debugPath,
          Buffer.from(JSON.stringify(gltfJson, null, 2)),
        )
      }

      const png = await encodePNGToBuffer(bitmap)
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
    toMatchPcbSnapshot(testPath: string): Promise<MatcherResult>
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
