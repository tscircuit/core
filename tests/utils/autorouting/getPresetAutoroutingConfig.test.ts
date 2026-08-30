import { describe, expect, test } from "bun:test"
import type { AutorouterConfig } from "@tscircuit/props"
import { getPresetAutoroutingConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"
import { getLocalAutoroutingStages } from "lib/utils/autorouting/local-autorouter-strategies"

describe("getPresetAutoroutingConfig", () => {
  test("treats auto_cloud preset string the same as auto-cloud", () => {
    const expected = getPresetAutoroutingConfig(
      "auto-cloud" as unknown as AutorouterConfig,
    )
    const alias = getPresetAutoroutingConfig(
      "auto_cloud" as unknown as AutorouterConfig,
    )

    expect(alias).toEqual(expected)
  })

  test("treats auto_cloud preset object the same as auto-cloud", () => {
    const expected = getPresetAutoroutingConfig({
      preset: "auto-cloud",
      serverUrl: "https://example.com",
    } as AutorouterConfig)

    const alias = getPresetAutoroutingConfig({
      preset: "auto_cloud",
      serverUrl: "https://example.com",
    } as AutorouterConfig)

    expect(alias).toEqual(expected)
  })

  test("normalizes fanout presets to local subcircuit routing", () => {
    expect(getPresetAutoroutingConfig("single_layer_fanout")).toMatchObject({
      local: true,
      groupMode: "subcircuit",
      preset: "single_layer_fanout",
    })
    expect(getPresetAutoroutingConfig("fanout")).toMatchObject({
      local: true,
      groupMode: "subcircuit",
      preset: "fanout",
    })
  })

  test("preserves a custom fanout algorithm without adding the built-in follow-up stage", () => {
    const algorithmFn = async () => {
      throw new Error("not called by config normalization")
    }
    const normalizedConfig = getPresetAutoroutingConfig({
      preset: "fanout",
      algorithmFn,
    })

    expect(normalizedConfig.algorithmFn).toBe(algorithmFn)
    expect(getLocalAutoroutingStages(normalizedConfig)).toHaveLength(1)
  })
})
