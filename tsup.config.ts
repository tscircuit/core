import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["index.ts", "jsx-runtime.ts", "jsx-dev-runtime.ts"],
  format: ["esm"],
  dts: true,
  noExternal: [
    "@tscircuit/breakout-point-solver",
    "@tscircuit/jlcpcb-manufacturing-specs",
  ],
})
