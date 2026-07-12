import { expect, test } from "bun:test"
import { transformSchematicSymbol } from "lib/utils/schematic/transform-schematic-symbol"
import type { SchSymbol } from "schematic-symbols"

test("transformSchematicSymbol rotates and flips a symbol without mutation", () => {
  const symbol: SchSymbol = {
    center: { x: 1, y: 1 },
    size: { width: 2, height: 4 },
    ports: [{ x: 0, y: 1, labels: ["left"] }],
    primitives: [
      {
        type: "path",
        points: [
          { x: 0, y: 1 },
          { x: 1, y: 2 },
        ],
        color: "primary",
      },
      {
        type: "text",
        text: "REF",
        x: 0,
        y: 1,
        anchor: "middle_left",
      },
      {
        type: "text",
        text: "TOP",
        x: 1,
        y: 2,
        anchor: "middle_top",
      },
    ],
  }
  const original = structuredClone(symbol)

  const rotated = transformSchematicSymbol(symbol, { rotation: 90 })
  expect(rotated.size).toEqual({ width: 4, height: 2 })
  expect(rotated.ports[0]).toMatchObject({ x: 1, y: 2 })
  expect(rotated.primitives[1]).toMatchObject({
    type: "text",
    x: 1,
    y: 2,
    anchor: "middle_top",
  })

  const flipped = transformSchematicSymbol(symbol, { flipHorizontal: true })
  expect(flipped.ports[0]).toMatchObject({ x: 2, y: 1 })
  expect(flipped.primitives[1]).toMatchObject({
    type: "text",
    x: 2,
    y: 1,
    anchor: "middle_right",
  })

  const flippedVertically = transformSchematicSymbol(symbol, {
    flipVertical: true,
  })
  expect(flippedVertically.primitives[2]).toMatchObject({
    type: "text",
    x: 1,
    y: 0,
    anchor: "middle_bottom",
  })

  expect(() => transformSchematicSymbol(symbol, { rotation: 45 })).toThrow(
    "Rotation must be a multiple of 90 degrees",
  )

  expect(symbol).toEqual(original)
})
