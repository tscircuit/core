import { expect, test, describe } from "bun:test"
import { getAllDimensionsForSchematicBox } from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import fs from "node:fs"

describe("getAllDimensionsForSchematicBox", () => {
  test("should correctly calculate dimensions and generate SVG", () => {
    const params: Parameters<typeof getAllDimensionsForSchematicBox>[0] = {
      schWidth: 1,
      schPinSpacing: 0.2,
      schPinStyle: {},
      pinCount: 8,
    }

    const dimensions = getAllDimensionsForSchematicBox(params)
    const size = dimensions.getSize()

    // Generate SVG
    let svg = `<svg width="500" height="500" viewBox="${-size.width / 2 - 10} ${-size.height / 2 - 10} ${size.width + 20} ${size.height + 20}" xmlns="http://www.w3.org/2000/svg"><g transform="scale(1,-1)">`

    // Draw the box
    svg += `<rect x="${-size.width / 2}" y="${-size.height / 2}" width="${size.width}" height="${size.height}" fill="none" stroke-width="0.1px" stroke="black" />`

    // Draw the pins
    for (let i = 1; i <= 8; i++) {
      const pos = dimensions.getPortPositionByPinNumber(i)
      svg += `<circle cx="${pos.x}" cy="${pos.y}" r="0.5" fill="red" />`
      svg += `<text x="${pos.x}" y="${pos.y + 0.2}" font-size="0.8" text-anchor="middle">${i}</text>`
    }

    svg += "</g></svg>"

    // Save SVG to file
    fs.writeFileSync(
      `${import.meta.dir}/__snapshots__/schematic_box_test.snapshot.svg`,
      svg,
    )
  })
})
