import { expect, test } from "bun:test"
import { getConstructionPropsSchema } from "lib/components/base-components/PrimitiveComponent/get-construction-props-schema"
import { z } from "zod"

test("construction schema cache follows schema identity and preserves effects", () => {
  const schema = z.object({ name: z.string(), value: z.number() })
  const extended = schema.extend({ value: z.string() })
  expect(
    getConstructionPropsSchema(schema).safeParse({ value: 2 }).success,
  ).toBe(true)
  expect(
    getConstructionPropsSchema(extended).safeParse({ value: 2 }).success,
  ).toBe(false)
  expect(getConstructionPropsSchema(extended).parse({ value: "two" })).toEqual({
    value: "two",
  })
  const transformed = schema.transform(({ value }) => value * 2)
  expect(
    getConstructionPropsSchema(transformed).parse({ name: "R1", value: 2 }),
  ).toBe(4)
  expect(
    getConstructionPropsSchema(transformed).safeParse({ value: 2 }).success,
  ).toBe(false)
})
