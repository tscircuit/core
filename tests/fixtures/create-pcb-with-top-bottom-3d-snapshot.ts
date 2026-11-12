import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToGltf } from "circuit-json-to-gltf"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { renderGLTFToPNGFromGLB } from "poppygl"

/**
 * Render one three-pane image from circuit-world geometry in mm (+X right,
 * +Y up the PCB, +Z above it). Cameras are points in the exported glTF frame
 * (+Y above the PCB, -X circuit-right, +Z circuit-up), targeting the origin.
 * Both 3D views share one GLB so they show the same holes and component poses.
 */
export async function createPcbWithTopBottom3dSnapshot(
  circuitJson: AnyCircuitElement[],
): Promise<string> {
  const paneWidth = 600
  const paneHeight = 560
  const headingHeight = 40
  const width = paneWidth * 3
  const height = paneHeight + headingHeight
  const pcbSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    width: paneWidth,
    height: paneHeight,
    showSolderPaste: false,
  })
  const glb = await convertCircuitJsonToGltf(circuitJson, {
    format: "glb",
    boardTextureResolution: 1024,
    includeModels: true,
    showBoundingBoxes: false,
  })
  if (!(glb instanceof ArrayBuffer)) {
    throw new Error("Expected a GLB ArrayBuffer for the three-pane snapshot")
  }

  const panels = [
    `<text x="20" y="26">PCB · both copper layers</text>`,
    `<g transform="translate(0 ${headingHeight})">${pcbSvg}</g>`,
  ]
  for (const [index, side] of ["top", "bottom"].entries()) {
    const left = (index + 1) * paneWidth
    const png = await renderGLTFToPNGFromGLB(glb, {
      width: paneWidth,
      height: paneHeight,
      camPos: side === "top" ? [0, 45, -24] : [0, -45, 24],
      lookAt: [0, 0, 0],
      up: "y+",
      fov: 35,
      backgroundColor: "#f2f3f5",
    })
    panels.push(
      `<text x="${left + 20}" y="26">3D · ${side === "top" ? "from above" : "from below"}</text>`,
      `<image x="${left}" y="${headingHeight}" width="${paneWidth}" height="${paneHeight}" href="data:image/png;base64,${Buffer.from(png).toString("base64")}"/>`,
    )
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#f2f3f5"/>
    <g font-family="sans-serif" font-size="18" fill="#28323c">${panels.join("\n")}</g>
    <path d="M${paneWidth} 0V${height} M${paneWidth * 2} 0V${height}" stroke="#d6dadd"/>
  </svg>`
}
