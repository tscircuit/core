import { test, expect } from "bun:test"
import { getMinimumFlexContainer } from "lib/utils/get-minimum-flex-container"

test("getMinimumFlexContainer – column direction with gap", () => {
  const items = [
    { width: 10, height: 2 },
    { width: 5, height: 4 },
    { width: 3, height: 5 },
  ]
  const { width, height } = getMinimumFlexContainer(items, {
    direction: "column",
    gap: 1,
  })

  expect(width).toBe(10)
  expect(height).toBe(13)
})