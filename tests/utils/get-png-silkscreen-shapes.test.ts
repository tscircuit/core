import { expect, test } from "bun:test"
import { encode } from "fast-png"
import { getPngSilkscreenShapes } from "lib/utils/pcb/get-png-silkscreen-shapes"
import { identity } from "transformation-matrix"

test("PNG ink regions preserve gaps across color formats and merge solid runs", () => {
  const fixtures: Parameters<typeof encode>[0][] = [
    { width: 2, height: 1, channels: 1, data: new Uint8Array([0, 255]) },
    {
      width: 2,
      height: 1,
      channels: 1,
      depth: 1,
      data: new Uint8Array([0b01000000]),
    },
    { width: 2, height: 1, channels: 2, data: new Uint8Array([0, 255, 0, 0]) },
    {
      width: 2,
      height: 1,
      channels: 3,
      data: new Uint8Array([0, 0, 0, 255, 255, 255]),
    },
    {
      width: 2,
      height: 1,
      channels: 1,
      depth: 16,
      data: new Uint16Array([0, 65535]),
    },
    {
      width: 2,
      height: 1,
      channels: 1,
      depth: 1,
      data: new Uint8Array([0b10000000]),
      palette: [
        [0, 0, 0, 0],
        [0, 0, 0, 255],
      ],
    },
  ]
  for (const fixture of fixtures) {
    const shapes = getPngSilkscreenShapes({
      pngBytes: encode(fixture),
      width: 2,
      height: 1,
      transform: identity(),
    })
    expect(shapes).toHaveLength(1)
    expect(shapes[0]!.outer_ring.vertices).toEqual(
      expect.arrayContaining([
        { x: -1, y: 0.5 },
        { x: 0, y: 0.5 },
        { x: 0, y: -0.5 },
        { x: -1, y: -0.5 },
      ]),
    )
  }
  const solid = getPngSilkscreenShapes({
    pngBytes: encode({
      width: 100,
      height: 100,
      channels: 1,
      data: new Uint8Array(10000),
    }),
    width: 5,
    height: 5,
    transform: identity(),
  })
  expect(solid).toHaveLength(1)
  const empty = getPngSilkscreenShapes({
    pngBytes: encode({
      width: 2,
      height: 2,
      channels: 4,
      data: new Uint8Array(16),
    }),
    width: 5,
    height: 5,
    transform: identity(),
  })
  expect(empty).toEqual([])
  expect(() =>
    getPngSilkscreenShapes({
      pngBytes: new Uint8Array([0]),
      width: 5,
      height: 5,
      transform: identity(),
    }),
  ).toThrow()
})
