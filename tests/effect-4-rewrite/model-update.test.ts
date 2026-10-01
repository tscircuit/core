import { expect, test } from "bun:test"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { runCoreSync } from "lib/effect/core-error"
import { z } from "zod"

test("native prop updates preserve replacement, partial parse and notification order", () => {
  const schema = z.object({
    name: z.string().optional(),
    value: z.number().optional(),
  })
  const notifications: string[] = []
  class TestPrimitive extends PrimitiveComponent<typeof schema> {
    get config() {
      return { componentName: "Test", zodProps: schema }
    }
    onPropsChange() {
      notifications.push("props")
    }
    onChildChanged() {
      notifications.push("parent")
    }
  }
  const parent = new TestPrimitive({ name: "parent" })
  const originalProps = Object.freeze({ name: "child", value: 1 })
  const child = new TestPrimitive(originalProps)
  parent.add(child)
  const originalParsed = Object.freeze(child._parsedProps)
  const update = Object.freeze({ value: 2 })
  const program = child.setPropsEffect(update)
  expect(child.props).toBe(originalProps)
  runCoreSync(program)
  expect(child.props).toEqual({ name: "child", value: 2 })
  expect(child._parsedProps).toEqual({ value: 2 })
  expect(notifications).toEqual(["props", "parent"])
  expect(originalParsed).toEqual({ name: "child", value: 1 })
  expect(originalProps.value).toBe(1)
  expect(() => child.setProps({ value: Number.NaN })).toThrow(z.ZodError)
})
