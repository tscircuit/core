import { expect, test } from "bun:test"
import type { AutorouterConfig, AutorouterPreset } from "@tscircuit/props"
import { getPresetAutoroutingConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"

const nativePresetCases: Array<{
  presets: AutorouterPreset[]
  expectedConfig: AutorouterConfig
}> = [
  {
    presets: [
      "default",
      "auto",
      "auto_local",
      "auto-local",
      "subcircuit",
      "tscircuit_beta",
      "krt",
      "freerouting",
    ],
    expectedConfig: { local: true, groupMode: "subcircuit" },
  },
  {
    presets: ["sequential_trace", "sequential-trace"],
    expectedConfig: { local: true, groupMode: "sequential-trace" },
  },
  {
    presets: ["single_layer_fanout"],
    expectedConfig: {
      local: true,
      groupMode: "subcircuit",
      preset: "single_layer_fanout",
    },
  },
  {
    presets: ["fanout"],
    expectedConfig: { local: true, groupMode: "subcircuit", preset: "fanout" },
  },
  {
    presets: ["simplify"],
    expectedConfig: {
      local: true,
      groupMode: "subcircuit",
      preset: "simplify",
    },
  },
]

const customAlgorithm = async () => {
  throw new Error("A native preset must remain the selected implementation")
}

test("native presets preserve component autorouter options and routing modes", () => {
  for (const { presets, expectedConfig } of nativePresetCases) {
    for (const preset of presets) {
      for (const allowViaInPad of [true, false]) {
        const autorouterConfig = Object.freeze({
          preset,
          allowViaInPad,
          traceClearance: 0.09,
          serverCacheEnabled: false,
          local: !expectedConfig.local,
          groupMode:
            expectedConfig.groupMode === "subcircuit"
              ? "sequential_trace"
              : "subcircuit",
          algorithmFn: customAlgorithm,
        } satisfies AutorouterConfig)
        const normalizedConfig = getPresetAutoroutingConfig(autorouterConfig)

        expect(normalizedConfig).toMatchObject({
          ...expectedConfig,
          allowViaInPad,
          traceClearance: 0.09,
          serverCacheEnabled: false,
        })
        expect(normalizedConfig.preset).toBe(expectedConfig.preset)
        expect(normalizedConfig.algorithmFn).toBeUndefined()
      }
    }
  }
})
