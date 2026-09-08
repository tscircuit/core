import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  dts: true,
  noExternal: [
    "@tscircuit/copper-pour-solver",
    "@tscircuit/fanout-solver",
    "@tscircuit/implicit-copper-pour-solver",
    "@tscircuit/jlcpcb-manufacturing-specs",
    "@tscircuit/via-stitch-solver",
    "@tscircuit/winding-breakout-point-solver",
  ],
})
