import { expect, spyOn, test } from "bun:test"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { z } from "zod"

test("construction reuses an optional-name schema but parses each component independently", () => {
  const schema = z.object({ name: z.string(), value: z.number().positive() })
  const partial = spyOn(schema, "partial")
  class TestComponent extends PrimitiveComponent<typeof schema> {
    get config() {
      return { componentName: "TestComponent", zodProps: schema }
    }
  }
  const first = new TestComponent({ value: 1 } as any)
  const second = new TestComponent({ name: "second", value: 2 })
  expect(first._parsedProps.value).toBe(1)
  expect(first._parsedProps.name).toBeUndefined()
  expect(second._parsedProps).toEqual({ name: "second", value: 2 })
  expect(first._parsedProps).not.toBe(second._parsedProps)
  expect(() => new TestComponent({ name: "bad", value: -1 })).toThrow()
  expect(partial).toHaveBeenCalledTimes(1)
  expect(schema.safeParse({ value: 1 }).success).toBe(false)
  partial.mockRestore()
})
