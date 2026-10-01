import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { validateComponentProps } from "lib/effect/component-model-props"
import { runCoreSync } from "lib/effect/core-error"
import { InvalidProps } from "lib/errors/InvalidProps"
import { z } from "zod"

test("Effect construction preserves Zod extensions, immutable inputs, and validation errors", () => {
  let parses = 0
  const schema = z
    .object({ name: z.string().optional(), value: z.number() })
    .transform((props) => {
      parses++
      return { ...props, doubled: props.value * 2 }
    })
  const props = Object.freeze({ name: "native", value: 3 })
  const validation = validateComponentProps({
    schema,
    props,
    componentName: "test",
    construction: true,
  })
  expect(parses).toBe(0)
  expect(runCoreSync(validation)).toEqual({
    name: "native",
    value: 3,
    doubled: 6,
  })
  expect(parses).toBe(1)
  class TestPrimitive extends PrimitiveComponent<typeof schema> {
    get config() {
      return { componentName: "Test", zodProps: schema }
    }
  }
  const primitive = new TestPrimitive(props)
  expect(primitive.props).toBe(props)
  expect(primitive._parsedProps.doubled).toBe(6)
  expect(props).toEqual({ name: "native", value: 3 })
  const invalid = validateComponentProps({
    schema,
    props: { name: "invalid", value: Number.NaN },
    componentName: "test",
  })
  const exit = Effect.runSyncExit(invalid)
  expect(exit._tag).toBe("Failure")
  expect(() => runCoreSync(invalid)).toThrow(InvalidProps)
  expect(() => new TestPrimitive({ value: Number.NaN })).toThrow(InvalidProps)
})
