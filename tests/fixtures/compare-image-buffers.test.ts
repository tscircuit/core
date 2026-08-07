import { expect, it } from "bun:test"
import { compareImageBuffers } from "./compare-image-buffers"

it("accepts byte-identical images without decoding them", async () => {
  const identicalMalformedSvg = Buffer.from("<svg>")

  const result = await compareImageBuffers(
    identicalMalformedSvg,
    identicalMalformedSvg,
  )

  expect(result).toEqual({
    equal: true,
    differentPixels: 0,
    totalPixels: 1,
  })
})

it("compares SVGs by their rendered pixels", async () => {
  const reference = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <rect width="16" height="16" fill="#000" />
    </svg>
  `)
  const equivalent = Buffer.from(
    '<svg height="16" width="16" xmlns="http://www.w3.org/2000/svg"><rect fill="#000000" height="16" width="16"/></svg>',
  )
  const different = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="#fff"/></svg>',
  )

  const equivalentResult = await compareImageBuffers(reference, equivalent)
  const differentResult = await compareImageBuffers(reference, different)

  expect(equivalentResult.equal).toBe(true)
  expect(differentResult.equal).toBe(false)
  expect(differentResult.differentPixels).toBeGreaterThan(0)
})
