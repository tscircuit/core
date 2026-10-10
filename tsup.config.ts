import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  dts: {
    resolve: ["@tscircuit/flex-utils", "@tscircuit/schematic-trace-solver"],
  },
  noExternal: [
    "@tscircuit/alphabet",
    "@tscircuit/cableprinter",
    "@tscircuit/dogbone-solver",
    "@tscircuit/flex-utils",
    "@tscircuit/bus-lanes-solver",
    "@tscircuit/fanout-solver",
    "@tscircuit/implicit-copper-pour-solver",
    "@tscircuit/jlcpcb-manufacturing-specs",
    "@tscircuit/schematic-trace-solver",
    "@tscircuit/via-stitch-solver",
    "@tscircuit/winding-breakout-point-solver",
  ],
})
