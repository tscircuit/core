import { afterEach } from "bun:test"

declare global {
  var debugOutputArray: { name: string; obj: any }[] | undefined
}

if (!global.debugOutputArray) {
  global.debugOutputArray = []
}

afterEach(() => {
  if (!global.debugOutputArray) return
  if (global.debugOutputArray?.length > 0) {
    for (const { name, obj } of global.debugOutputArray) {
      const fileName = `debug-output/${name}.json`
      console.log(`Writing debug output to ${fileName}`)
      Bun.write(
        fileName,
        typeof obj === "string" ? obj : JSON.stringify(obj, null, 2),
      )
    }
  }
  global.debugOutputArray = []
})
