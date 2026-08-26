import { expect, test } from "bun:test"
import { getAutoroutedViaLayers } from "lib/utils/getViaSpanLayers"

test("autorouted vias use the board's physical span policy", () => {
  expect(
    getAutoroutedViaLayers({
      fromLayer: "top",
      toLayer: "inner2",
      layerCount: 6,
      allowBlindAndBuriedVias: false,
    }),
  ).toEqual(["top", "inner1", "inner2", "inner3", "inner4", "bottom"])

  expect(
    getAutoroutedViaLayers({
      fromLayer: "top",
      toLayer: "inner2",
      layerCount: 6,
      allowBlindAndBuriedVias: true,
    }),
  ).toEqual(["top", "inner1", "inner2"])

  expect(
    getAutoroutedViaLayers({
      fromLayer: "top",
      toLayer: "inner2",
      layerCount: 6,
      allowBlindAndBuriedVias: true,
      physicalLayers: ["top", "inner1", "inner2", "inner3", "inner4", "bottom"],
    }),
  ).toEqual(["top", "inner1", "inner2", "inner3", "inner4", "bottom"])

  expect(
    getAutoroutedViaLayers({
      fromLayer: "top",
      toLayer: "inner2",
      layerCount: 6,
      allowBlindAndBuriedVias: false,
      physicalLayers: ["top", "inner1", "inner2"],
    }),
  ).toEqual(["top", "inner1", "inner2", "inner3", "inner4", "bottom"])
})
