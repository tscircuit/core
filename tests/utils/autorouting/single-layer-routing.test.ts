import { expect, test } from "bun:test"
import type { AutorouterConfig } from "@tscircuit/props"
import { BusLanesAutorouter } from "lib/utils/autorouting/BusLanesAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getPresetAutoroutingConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"
import { getLocalAutoroutingStages } from "lib/utils/autorouting/local-autorouter-strategies"

test("single_layer_routing resolves to the bus_lanes strategy without mutating config", () => {
  const simpleRouteJson: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.15,
    obstacles: [],
    connections: [],
    bounds: { minX: -1, maxX: 1, minY: -1, maxY: 1 },
  }

  for (const preset of ["single_layer_routing"] as const) {
    const config = Object.freeze({
      preset,
      traceClearance: 0.2,
      allowViaInPad: true,
    } satisfies AutorouterConfig)
    const expected = getPresetAutoroutingConfig({
      ...config,
      preset: "bus_lanes",
    })
    expect(getPresetAutoroutingConfig(preset)).toEqual(
      getPresetAutoroutingConfig("bus_lanes"),
    )
    const normalizedConfig = getPresetAutoroutingConfig(config)
    expect(normalizedConfig).toEqual(expected)
    expect(config.preset).toBe(preset)

    const stages = getLocalAutoroutingStages(normalizedConfig)
    expect(stages).toHaveLength(1)
    const strategy = stages[0]!.strategy
    expect(strategy.name).toBe("bus_lanes")
    expect(strategy.cacheable).toBe(false)
    expect(
      strategy.create({ simpleRouteJson, commonAutorouterOptions: {} }),
    ).toBeInstanceOf(BusLanesAutorouter)
  }
})
