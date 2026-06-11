import { expect, test } from "bun:test"
import { svgToBrepShapes } from "lib/utils/svg/svg-to-brep-shapes"

test("svgToBrepShapes respects fill rules and does not merge nested separate elements into holes", () => {
  const evenOddSvg = `
    <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#000"
        fill-rule="evenodd"
        d="M 0 0 H 10 V 10 H 0 Z M 2 2 H 8 V 8 H 2 Z"
      />
    </svg>
  `

  const nonZeroSameDirectionSvg = `
    <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#000"
        d="M 0 0 H 10 V 10 H 0 Z M 2 2 H 8 V 8 H 2 Z"
      />
    </svg>
  `

  const nonZeroOppositeDirectionSvg = `
    <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#000"
        d="M 0 0 H 10 V 10 H 0 Z M 2 2 V 8 H 8 V 2 Z"
      />
    </svg>
  `

  const separateNestedElementsSvg = `
    <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
      <path fill="#000" d="M 0 0 H 10 V 10 H 0 Z" />
      <path fill="#000" d="M 2 2 H 8 V 8 H 2 Z" />
    </svg>
  `

  const evenOddShapes = svgToBrepShapes(evenOddSvg, { width: 10, height: 10 })
  const nonZeroSameDirectionShapes = svgToBrepShapes(nonZeroSameDirectionSvg, {
    width: 10,
    height: 10,
  })
  const nonZeroOppositeDirectionShapes = svgToBrepShapes(
    nonZeroOppositeDirectionSvg,
    {
      width: 10,
      height: 10,
    },
  )
  const separateNestedElementShapes = svgToBrepShapes(
    separateNestedElementsSvg,
    {
      width: 10,
      height: 10,
    },
  )

  expect(evenOddShapes).toHaveLength(1)
  expect(evenOddShapes[0]!.inner_rings).toHaveLength(1)

  expect(nonZeroSameDirectionShapes).toHaveLength(1)
  expect(nonZeroSameDirectionShapes[0]!.inner_rings).toHaveLength(0)

  expect(nonZeroOppositeDirectionShapes).toHaveLength(1)
  expect(nonZeroOppositeDirectionShapes[0]!.inner_rings).toHaveLength(1)

  expect(separateNestedElementShapes).toHaveLength(2)
  expect(
    separateNestedElementShapes.every(
      (shape) => shape.inner_rings.length === 0,
    ),
  ).toBe(true)
})
