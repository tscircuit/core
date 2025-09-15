import type { getAllDimensionsForSchematicBox } from "lib/utils/schematic/getAllDimensionsForSchematicBox"

const MARGIN = 1

export const getSchematicBoxSvg = (
  dimensions: ReturnType<typeof getAllDimensionsForSchematicBox>,
) => {
  const size = dimensions.getSize()
  let svg = `<svg width="500" height="500" viewBox="${-size.width / 2 - MARGIN} ${-size.height / 2 - MARGIN} ${size.width + MARGIN * 2} ${size.height + MARGIN * 2}" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1,-1)">`

  // Draw the box
  svg += `<rect x="${-size.width / 2}" y="${-size.height / 2}" width="${size.width}" height="${size.height}" fill="none" stroke-width="0.02px" stroke="black" />`

  // Draw the pins
  for (let i = 1; i <= dimensions.pinCount; i++) {
    const pos = dimensions.getPortPositionByPinNumber(i)
    if (!pos) continue
    svg += `<circle cx="${pos.x}" cy="${pos.y}" r="0.02" fill="red" />`
    svg += `<text x="${pos.x + 0.1}" y="${pos.y + 0.01}" transform="translate(0,${(pos.y + 0.01) * 2}) scale(1,-1)"  fill="green" font-size="0.1" text-anchor="middle">${i}</text>`
  }

  svg += "</g></svg>"
  return svg
}
