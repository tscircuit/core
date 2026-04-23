import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  dts: true,
  noExternal: ["@tscircuit/jlcpcb-manufacturing-specs"],
})