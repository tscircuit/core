import { expect, test } from "bun:test"
import { getPresetAutoroutingConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"

test("presets retain explicit trace clearance without changing their routing mode", () => {
  for (const preset of [
    "auto",
    "auto_local",
    "auto_cloud",
    "fanout",
    "bus_lanes",
  ] as const) {
    const baseline = getPresetAutoroutingConfig(preset)
    for (const traceClearance of [0, "0.35mm", 0.65]) {
      expect(getPresetAutoroutingConfig({ preset, traceClearance })).toEqual({
        ...baseline,
        traceClearance,
      })
    }
  }
})
