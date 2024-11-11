import { test } from "bun:test"

test("it should normalize schPortArrangement 1", () => {
  const result: NormalizationResult = normalizeSchPortArrangement({
    leftSide: {
      pins: [29, 7, 8, 20, 19, 22],
      direction: "top-to-bottom",
    },
    topSide: {
      direction: "right-to-left",
      pins: [4, 18],
    },
    rightSide: {
      direction: "bottom-to-top",
      pins: [12, 13, 14, 15, 16, 17, 23],
    },
    bottomSide: {
      direction: "left-to-right",
      pins: [2, 3],
    },
  })

  type NormalizationResult = Array<{
    side: "left" | "bottom" | "right" | "top"
    trueCcwPinIndex: number
    pinNumber: number
    pinName: string
  }>
})
