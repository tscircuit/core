import { alphabetText } from "./alphabet-text"
import { expect } from "bun:test"
import { Resvg, type ResvgRenderOptions } from "@resvg/resvg-js"
import { convertCircuitJsonToGltf } from "circuit-json-to-gltf"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { RootCircuit } from "lib/RootCircuit"
import type { AnyCircuitElement } from "circuit-json"
import { renderGLTFToPNGFromGLB } from "poppygl"
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, basename, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  compareImageBuffers,
  createImageDiff,
} from "tests/fixtures/compare-image-buffers"
import {
  resolvePoppyglOptions,
  type Match3dSnapshotOptions,
} from "tests/fixtures/extend-expect-3d-matcher"

interface AssemblySnapshotPanel {
  title: string
  code: string
  annotation: string
  circuit: RootCircuit | AnyCircuitElement[]
  view?: "3d" | "schematic"
  renderOptions?: Match3dSnapshotOptions
}

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")

// Bundle an OFL monospace font so code (including braces) renders identically
// on macOS and CI; the host's available fonts must not change these snapshots.
const resvgOptions: ResvgRenderOptions = {
  font: {
    loadSystemFonts: false,
    fontFiles: [
      fileURLToPath(
        new URL("../../fixtures/assets/RobotoMono.ttf", import.meta.url),
      ),
    ],
    defaultFontFamily: "Roboto Mono",
  },
}

const legacySvgText = (
  text: string,
  x: number,
  y: number,
  size = 17,
  color = "#334155",
) =>
  `<text xml:space="preserve" x="${x}" y="${y}" font-family="Roboto Mono" font-size="${size}" fill="${color}">${escapeXml(text)}</text>`

/** Review snapshot: each panel pairs the fixture's relevant TSX with its actual
 * rendered output. Layout coordinates are image pixels, not circuit geometry.
 */
export const expectAssemblySnapshot = async (
  testPath: string,
  {
    title,
    panels,
    columns = 1,
    font = "legacy",
  }: {
    title: string
    panels: AssemblySnapshotPanel[]
    columns?: number
    font?: "legacy" | "alphabet"
  },
) => {
  const svgText =
    font === "alphabet"
      ? (text: string, x: number, y: number, size = 17, _color?: string) =>
          alphabetText({ text, x, y, size })
      : legacySvgText
  const panelWidth = 1000
  const codeWidth = 530
  const gap = 20
  const renderSize = 430
  const rowHeight = Math.max(
    440,
    ...panels.map((panel) => 130 + panel.code.split("\n").length * 23),
  )
  const width = columns * panelWidth + (columns + 1) * gap
  const height = 94 + Math.ceil(panels.length / columns) * (rowHeight + gap)
  const svgParts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#e2e8f0"/>`,
    svgText(title, gap + 10, 39, 25, "#0f172a"),
    svgText("TSX on the left / rendered output on the right", gap + 10, 68, 16),
  ]
  for (const [index, panel] of panels.entries()) {
    if (panel.circuit instanceof RootCircuit)
      await panel.circuit.renderUntilSettled()
    const circuitJson =
      panel.circuit instanceof RootCircuit
        ? panel.circuit.getCircuitJson()
        : panel.circuit
    let png: Uint8Array
    if (panel.view === "schematic") {
      png = new Resvg(
        convertCircuitJsonToSchematicSvg(circuitJson, {
          width: renderSize,
          height: renderSize,
        }),
        resvgOptions,
      )
        .render()
        .asPng()
    } else {
      const glb = await convertCircuitJsonToGltf(circuitJson, {
        boardTextureResolution: 512,
        includeModels: true,
        showBoundingBoxes: false,
        format: "glb",
      })
      const renderOptions = await resolvePoppyglOptions(
        circuitJson,
        panel.renderOptions,
      )
      png = await renderGLTFToPNGFromGLB(Buffer.from(glb as Uint8Array), {
        ...renderOptions,
        width: renderSize,
        height: renderSize,
        fov: renderOptions.fov ?? 40,
        grid: false,
        backgroundColor: [1, 1, 1],
      })
    }
    const x = gap + (index % columns) * (panelWidth + gap)
    const y = 94 + Math.floor(index / columns) * (rowHeight + gap)
    svgParts.push(
      `<rect x="${x}" y="${y}" width="${panelWidth}" height="${rowHeight}" rx="8" fill="white"/>`,
      svgText(panel.title, x + 20, y + 34, 21, "#0f172a"),
      `<rect x="${x + 14}" y="${y + 55}" width="${codeWidth - 24}" height="${rowHeight - 110}" rx="5" fill="#f1f5f9"/>`,
      `<image x="${x + codeWidth}" y="${y + 45}" width="${renderSize}" height="${rowHeight - 100}" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${Buffer.from(png).toString("base64")}"/>`,
      ...panel.code
        .split("\n")
        .map((line, lineIndex) =>
          svgText(line, x + 26, y + 86 + lineIndex * 23, 17, "#0f172a"),
        ),
      svgText(panel.annotation, x + 20, y + rowHeight - 23, 15),
    )
  }
  svgParts.push("</svg>")
  const png = new Resvg(
    svgParts.join(""),
    font === "alphabet" ? { font: { loadSystemFonts: false } } : resvgOptions,
  )
    .render()
    .asPng()
  const snapshotDir = join(dirname(testPath), "__snapshots__")
  const snapshotPath = join(
    snapshotDir,
    `${basename(testPath).replace(/\.test\.tsx?$/, "")}-annotated.snap.png`,
  )
  const update =
    process.env.BUN_UPDATE_SNAPSHOTS ||
    process.argv.includes("-u") ||
    process.argv.includes("--update-snapshots")
  if (!existsSync(snapshotPath) || update) {
    mkdirSync(snapshotDir, { recursive: true })
    writeFileSync(snapshotPath, png)
    console.log("Writing snapshot at", snapshotPath)
    return
  }
  const reference = readFileSync(snapshotPath)
  const result = await compareImageBuffers(reference, png, {
    strict: false,
    tolerance: 7,
    ignoreAntialiasing: true,
    antialiasingTolerance: 4,
  })
  const differentFraction =
    (result.differentPixels ?? 0) / (result.totalPixels ?? 1)
  if (!result.equal && differentFraction > 0.002) {
    const diffPath = snapshotPath.replace(".snap.png", ".diff.png")
    await createImageDiff({
      reference,
      current: png,
      diffPath,
      highlightColor: "#ff00ff",
      tolerance: 7,
      ignoreAntialiasing: true,
      antialiasingTolerance: 4,
    })
    expect(
      differentFraction,
      `Annotated snapshot differs; see ${diffPath}`,
    ).toBeLessThanOrEqual(0.002)
  }
}
