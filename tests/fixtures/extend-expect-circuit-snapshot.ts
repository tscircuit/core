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
import { convertCircuitJsonToSimple3dSvg } from "circuit-json-to-simple-3d"
import { convertCircuitJsonToGltf } from "circuit-json-to-gltf"
import {
  renderSceneFromGLTF,
  createSceneFromGLTF,
  encodePNGToBuffer,
  pureImageFactory,
} from "poppygl"

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
  mode: "pcb" | "schematic" | "simple-3d" | "3d-png"
  updateSnapshot: boolean
  forceUpdateSnapshot: boolean
  options?: any
}): Promise<MatcherResult> {
  testPath = testPath.replace(/\.test\.tsx?$/, "")
  const snapshotDir = path.join(path.dirname(testPath || ""), "__snapshots__")
  const isPng = mode === "3d-png"
  const snapshotName = `${path.basename(testPath || "")}-${mode}.snap.${isPng ? "png" : "svg"}`
  const filePath = path.join(snapshotDir, snapshotName)

  let output: string | Buffer
  switch (mode) {
    case "pcb":
      output = convertCircuitJsonToPcbSvg(soup)
      break
    case "schematic":
      output = convertCircuitJsonToSchematicSvg(soup, options)
      break
    case "simple-3d":
      output = await convertCircuitJsonToSimple3dSvg(soup, options)
      break
    case "3d-png": {
      const gltf = (await convertCircuitJsonToGltf(soup, options)) as any
      const scene = createSceneFromGLTF(gltf, {
        buffers:
          gltf.buffers?.map((b: any) =>
            b.uri
              ? Buffer.from(b.uri.split(",")[1], "base64")
              : Buffer.alloc(0),
          ) || [],
        images: [],
      })
      const renderResult = (await renderSceneFromGLTF(
        scene,
        undefined,
        pureImageFactory,
      )) as any
      const bitmap = renderResult?.bitmap
      if (
        Buffer.isBuffer(bitmap) ||
        bitmap instanceof (globalThis as any).Uint8Array
      ) {
        output = bitmap
      } else {
        output = await encodePNGToBuffer(bitmap)
      }
      break
    }
  }

  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true })
  }

  if (!fs.existsSync(filePath) || forceUpdateSnapshot) {
    console.log("Creating snapshot at", filePath)
    fs.writeFileSync(filePath, output)
    return {
      message: () => `Snapshot created at ${filePath}`,
      pass: true,
    }
  }

  let existingSnapshot: Buffer
  if (isPng) {
    existingSnapshot = fs.readFileSync(filePath)
  } else {
    existingSnapshot = Buffer.from(fs.readFileSync(filePath, "utf-8"))
  }

  const currentBuffer = Buffer.isBuffer(output) ? output : Buffer.from(output)

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
    fs.writeFileSync(filePath, output)
    return {
      message: () => `Snapshot updated at ${filePath}`,
      pass: true,
    }
  }

  const extension = isPng ? ".snap.png" : ".snap.svg"
  const diffPath = filePath.replace(extension, ".diff.png")
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

  async toMatchPng3dSnapshot(
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
      mode: "3d-png",
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
    toMatchPng3dSnapshot(
      testPath: string,
      options?: Parameters<typeof convertCircuitJsonToGltf>[1],
    ): Promise<MatcherResult>
    toMatchSimple3dSnapshot(
      testPath: string,
      options?: Parameters<typeof convertCircuitJsonToSimple3dSvg>[1],
    ): Promise<MatcherResult>
  }
}
