import { getSvgFromGraphicsObject, type GraphicsObject } from "graphics-debug"
import { rmSync, mkdirSync } from "node:fs"

declare global {
  var debugGraphics: GraphicsObject[] | undefined
}

export const writeGlobalDebugGraphics = () => {
  if (!global.debugGraphics) return
  if (process.env.CI) return

  // Delete/recreate the debug-graphics directory
  rmSync("debug-graphics", { recursive: true, force: true })
  mkdirSync("debug-graphics")

  for (const g of global.debugGraphics) {
    console.log(`Writing debug-graphics/${g.title}.svg`)
    Bun.write(
      `debug-graphics/${g.title}.svg`,
      getSvgFromGraphicsObject(g, {
        backgroundColor: "white",
      }),
    )
  }
}
