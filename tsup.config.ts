import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  dts: {
    compilerOptions: {
      paths: {
        "lib/*": ["lib/*"],
        "@tscircuit/test-point-rerouter": [
          "./.build/test-point-rerouter/index.d.ts",
        ],
      },
    },
    resolve: [
      "@tscircuit/flex-utils",
      "@tscircuit/schematic-trace-solver",
      "@tscircuit/test-point-rerouter",
    ],
  },
  noExternal: [
    "@tscircuit/cad-collision-checking",
    "jscad-to-manifold",
    "@tscircuit/test-point-rerouter",
    "@tscircuit/jscad",
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
