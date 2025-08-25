import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  dts: true,
  target: "es2020", // Lower target to avoid newer import assertion syntax
  esbuildOptions(options) {
    // Transform JSON imports to be compatible with older bundlers
    options.supported = {
      ...options.supported,
      "import-assertions": false,
    }
  },
})
