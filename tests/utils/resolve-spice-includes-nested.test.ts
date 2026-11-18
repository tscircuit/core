import { expect, test } from "bun:test"
import { resolveSpiceIncludes } from "lib/utils/simulation/resolve-spice-includes"

test("resolves nested includes relative to their containing library", async () => {
  const paths: string[] = []
  const source = await resolveSpiceIncludes({
    source: '.include "./models/outer.lib"',
    platform: {
      resolveProjectStaticFileImportUrl: async (path) => {
        paths.push(path)
        if (path === "/models/outer.lib") {
          return `data:text/plain,${encodeURIComponent('.include "../shared/gain.lib"')}`
        }
        return `data:text/plain,${encodeURIComponent("* model license\n.subckt GAIN IN OUT\nR1 IN OUT 1k\n.ends GAIN")}`
      },
    },
  })

  expect(paths).toEqual(["/models/outer.lib", "/shared/gain.lib"])
  expect(source).toContain("* model license")
  expect(source).toContain(".subckt GAIN IN OUT")
  expect(source).not.toContain(".include")
})
