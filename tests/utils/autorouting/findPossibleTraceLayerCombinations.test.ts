import { it, expect } from "bun:test";
import { findPossibleTraceLayerCombinations } from "lib/utils/autorouting/findPossibleTraceLayerCombinations";

it("find possible trace layer combinations 1", () => {
  const candidates = findPossibleTraceLayerCombinations([
    {
      layers: ["top", "bottom"],
    },
    {
      via: true,
    },
    {
      layers: ["top", "bottom"],
    },
  ]);

  const expected = ["top,bottom,bottom", "bottom,top,top"].join("\n");

  expect(candidates.map((c) => c.layer_path.join(",")).join("\n")).toBe(
    expected,
  );
});

it("find possible trace layer combinations 2", () => {
  const candidates = findPossibleTraceLayerCombinations([
    {
      layers: ["top", "bottom", "inner1"],
    },
    {
      via: true,
    },
    {
      layers: ["top", "bottom", "inner1"],
    },
  ]);

  expect(candidates.map((c) => c.layer_path.join(",")).length).toBe(6);
});
