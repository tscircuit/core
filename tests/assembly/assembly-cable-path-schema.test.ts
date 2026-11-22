import { expect, test } from "bun:test"
import { cad_cable } from "circuit-json"
import { getCablePathSchema } from "lib/components/primitive-components/resolve-assembly-cable"
import { z } from "zod"

test("authored cable path validation works with nested schema refinements", () => {
  const pathSchema = getCablePathSchema(cad_cable)
  const refinedCable = z.object({ path: pathSchema }).refine(() => true)
  const doubleRefinedCable = refinedCable.refine(() => true)

  expect(getCablePathSchema(refinedCable)).toBe(pathSchema)

  const start = { x: 0, y: 0, z: 0 }
  const end = { x: 1, y: 0, z: 0 }
  const refinedPathSchema = getCablePathSchema(doubleRefinedCable)

  expect(refinedPathSchema.parse([start, end])).toEqual([start, end])
  expect(refinedPathSchema.safeParse([start, start]).success).toBe(false)
})
