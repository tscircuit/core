import type { AnyCircuitElement } from "circuit-json"
import {
  convertCircuitJsonToGltf,
  type ConversionOptions,
} from "circuit-json-to-gltf"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import {
  renderGLTFToPNGFromGLB,
  type RenderGLTFToPNGFromGLBOptions,
} from "poppygl"

export interface PcbWithFourViewSnapshotOptions {
  gltf?: ConversionOptions
  /** Camera target point in exported glTF coordinates: +Y up, mm. */
  lookAt: [number, number, number]
  /** Camera distance from the target, in mm. */
  distance: number
  pcb?: Parameters<typeof convertCircuitJsonToPcbSvg>[1]
}

/** Create one SVG snapshot: flat PCB above a labeled 2x2 grid of 3D views.
 * Circuit JSON input stays in its right-handed +Z-up PCB frame (mm).
 * Camera points below use the exported glTF frame (+Y up, mm).
 * The board is exported once so all four views show exactly the same geometry.
 */
export async function createPcbWithFourViewSnapshot(
  circuitJson: AnyCircuitElement[],
  { gltf, lookAt, distance, pcb }: PcbWithFourViewSnapshotOptions,
): Promise<string> {
  const width = 1200
  const pcbHeight = 320
  const headingHeight = 36
  const tileWidth = width / 2
  const tileHeight = 500
  const gridTop = pcbHeight + headingHeight
  const height = gridTop + tileHeight * 2
  const pcbSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    showDebugObjects: true,
    ...pcb,
    width,
    height: pcbHeight,
  })
  const glb = await convertCircuitJsonToGltf(circuitJson, {
    boardTextureResolution: 1024,
    ...gltf,
    format: "glb",
  })
  if (!(glb instanceof ArrayBuffer)) {
    throw new Error("Expected a GLB ArrayBuffer for four-view snapshot")
  }

  const [x, y, z] = lookAt
  const views: {
    label: string
    camPos: [number, number, number]
    up: RenderGLTFToPNGFromGLBOptions["up"]
  }[] = [
    {
      label: "Isometric",
      camPos: [x + distance * 0.58, y + distance * 0.42, z + distance * 0.74],
      up: "y+",
    },
    { label: "Side · from +Z", camPos: [x, y, z + distance], up: "y+" },
    { label: "End · from +X", camPos: [x + distance, y, z], up: "y+" },
    { label: "Top · from +Y", camPos: [x, y + distance, z], up: "z-" },
  ]
  const panels = [
    `<text x="20" y="25">Flat PCB</text>`,
    `<g transform="translate(0 ${headingHeight})">${pcbSvg}</g>`,
  ]
  for (const [i, view] of views.entries()) {
    const left = (i % 2) * tileWidth
    const top = gridTop + Math.floor(i / 2) * tileHeight
    const png = await renderGLTFToPNGFromGLB(glb, {
      width: tileWidth,
      height: tileHeight - headingHeight,
      camPos: view.camPos,
      up: view.up,
      lookAt,
      fov: 35,
      backgroundColor: "#f2f3f5",
    })
    panels.push(
      `<text x="${left + 20}" y="${top + 25}">${view.label}</text>`,
      `<image x="${left}" y="${top + headingHeight}" width="${tileWidth}" height="${tileHeight - headingHeight}" href="data:image/png;base64,${Buffer.from(png).toString("base64")}"/>`,
    )
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#f2f3f5"/>
    <g font-family="sans-serif" font-size="18" fill="#28323c">${panels.join("\n")}</g>
    <path d="M0 ${gridTop}H${width} M0 ${gridTop + tileHeight}H${width} M${tileWidth} ${gridTop}V${height}" stroke="#d6dadd" fill="none"/>
  </svg>`
}
