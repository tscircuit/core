import { expect, test } from "bun:test"
import { findPossibleTraceLayerCombinations } from "lib/utils/autorouting/findPossibleTraceLayerCombinations"
import { getBoardAvailableLayers } from "lib/utils/getViaSpanLayers"

test("optional via route hints can select inner8 on a ten-layer board", () => {
  const candidates = findPossibleTraceLayerCombinations(
    [{ layers: ["top"] }, { optional_via: true }, { layers: ["inner8"] }],
    { layerSelectionPreference: getBoardAvailableLayers(10) },
  )

  expect(candidates).toEqual([
    {
      layer_path: ["top", "inner8", "inner8"],
    },
  ])
})
