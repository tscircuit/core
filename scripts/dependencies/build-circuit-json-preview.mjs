import { existsSync, mkdtempSync, cpSync, rmSync, symlinkSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { build } from "tsup"

// Temporary bootstrap for unpublished circuit-json #830. Replace the Git pin
// with its npm release and remove this script once the schema is published.
const root = fileURLToPath(new URL("../../", import.meta.url))
const name = "circuit-json"
const directory = "src"
const extension = ".mjs"
const dependency = `${root}node_modules/${name}/`
if (!existsSync(`${dependency}dist/index${extension}`)) {
  // Declaration bundlers treat files inside node_modules as external. Build
  // from a temporary source copy so the preview has self-contained types.
  const source = mkdtempSync(`${root}.circuit-json-build-`)
  try {
    cpSync(`${dependency}${directory}`, `${source}/${directory}`, {
      recursive: true,
    })
    cpSync(`${dependency}tsconfig.json`, `${source}/tsconfig.json`)
    symlinkSync(`${root}node_modules`, `${source}/node_modules`, "dir")
    await build({
      config: false,
      entry: { index: `${source}/${directory}/index.ts` },
      outDir: `${source}/dist`,
      format: ["esm"],
      outExtension: () => ({ js: extension }),
      tsconfig: `${source}/tsconfig.json`,
      dts: {
        compilerOptions: {
          baseUrl: source,
          paths: { [`${directory}/*`]: [`${directory}/*`] },
        },
      },
      external: ["zod", "format-si-unit"],
      esbuildOptions(options) {
        options.alias = { [directory]: `${source}/${directory}` }
      },
    })
    cpSync(`${source}/dist`, `${dependency}dist`, { recursive: true })
    cpSync(`${source}/dist/index.d.ts`, `${dependency}dist/index.d.mts`)
  } finally {
    rmSync(source, { recursive: true, force: true })
  }
}
