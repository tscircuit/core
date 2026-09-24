import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  dts: { resolve: ["@tscircuit/flex-utils"] },
  noExternal: [
    "@tscircuit/circuit-json-schematic-placement-analysis",
    "@tscircuit/flex-utils",
    "@tscircuit/bus-lanes-solver",
    "@tscircuit/fanout-solver",
    "@tscircuit/implicit-copper-pour-solver",
    "@tscircuit/jlcpcb-manufacturing-specs",
    "@tscircuit/via-stitch-solver",
    "@tscircuit/winding-breakout-point-solver",
  ],
})
