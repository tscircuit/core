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

  test("topola preset points at local solve-endpoint", () => {
    const config = getPresetAutoroutingConfig(
      "topola" as unknown as AutorouterConfig,
    )
    expect(config).toMatchObject({
      local: false,
      groupMode: "subcircuit",
      serverUrl: "http://127.0.0.1:3099",
      serverMode: "solve-endpoint",
      inputFormat: "simplified",
      serverCacheEnabled: false,
    })
  })

  test("topola preset allows overriding serverUrl", () => {
    const config = getPresetAutoroutingConfig({
      preset: "topola",
      serverUrl: "http://127.0.0.1:4099",
    } as AutorouterConfig)
    expect(config.serverUrl).toBe("http://127.0.0.1:4099")
    expect(config.serverMode).toBe("solve-endpoint")
  })
})
