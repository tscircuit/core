import { expect, test } from "bun:test"

test("browser consumers can bundle the autorouter without native worker adapters", async () => {
  const build = await Bun.build({
    entrypoints: [
      new URL(
        "../../../../lib/utils/autorouting/CapacityMeshAutorouter.ts",
        import.meta.url,
      ).pathname,
    ],
    target: "browser",
    write: false,
  })
  expect(build.success).toBe(true)
  const source = await build.outputs[0]!.text()
  expect(source).not.toContain("node:worker_threads")
  expect(source).not.toContain("bunWorkerSource")
  expect(source).not.toContain("nodeWorkerSource")
})
