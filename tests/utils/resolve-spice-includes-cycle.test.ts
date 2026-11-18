import { expect, test } from "bun:test"
import { resolveSpiceIncludes } from "lib/utils/simulation/resolve-spice-includes"

test("reports a circular include using the project file path", async () => {
  await expect(
    resolveSpiceIncludes({
      source: '.include "./loop.lib"',
      platform: {
        resolveProjectStaticFileImportUrl: async () =>
          `data:text/plain,${encodeURIComponent('.include "./loop.lib"')}`,
      },
    }),
  ).rejects.toThrow('Circular SPICE include: "./loop.lib".')
})
