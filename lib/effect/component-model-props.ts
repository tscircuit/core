import * as Effect from "effect/Effect"
import type { z } from "zod"
import { getConstructionPropsSchema } from "../components/base-components/PrimitiveComponent/get-construction-props-schema"
import { InvalidProps } from "../errors/InvalidProps"
import { coreSync } from "./core-error"

/** Zod remains the public extension contract; parsing is an Effect boundary. */
export function validateComponentProps<Schema extends z.ZodType>(request: {
  schema: Schema
  props: z.input<Schema>
  componentName: string
  construction?: boolean
}) {
  return Effect.gen(function* () {
    const schema = request.construction
      ? yield* coreSync(
          () => getConstructionPropsSchema(request.schema),
          "construction_props_schema",
        )
      : request.schema
    const parsed = yield* coreSync(
      () => schema.safeParse(request.props ?? {}),
      "parse_component_props",
    )
    if (!parsed.success) {
      return yield* coreSync(() => {
        throw new InvalidProps(
          request.componentName,
          request.props ?? {},
          parsed.error.format(),
        )
      }, "invalid_component_props")
    }
    return parsed.data as z.output<Schema>
  })
}

/** Updates retain ZodError, rather than construction's InvalidProps error. */
export function parseComponentPropUpdate<Schema extends z.ZodType>(request: {
  schema: Schema
  props: unknown
}) {
  return coreSync(
    () => request.schema.parse(request.props) as z.output<Schema>,
    "parse_component_prop_update",
  )
}
