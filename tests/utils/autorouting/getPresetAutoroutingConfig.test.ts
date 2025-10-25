import { describe, expect, test } from "bun:test"
import type { AutorouterConfig } from "@tscircuit/props"
import { getPresetAutoroutingConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"

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
})
