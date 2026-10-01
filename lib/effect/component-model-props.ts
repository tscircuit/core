import type { z } from "zod"
import { getConstructionPropsSchema } from "../components/base-components/PrimitiveComponent/get-construction-props-schema"
import { InvalidProps } from "../errors/InvalidProps"
import { getPinNumberFromPinLabelsKey } from "../utils/schematic/getPinNumberFromPinLabelsKey"
import { coreSync } from "./core-error"

/** Zod remains the public extension contract; parsing is an Effect boundary. */
export function validateComponentProps<Schema extends z.ZodType>(request: {
  schema: Schema
  props: z.input<Schema>
  componentName: string
  construction?: boolean
}) {
  return coreSync(() => {
    const schema = request.construction
      ? getConstructionPropsSchema(request.schema)
      : request.schema
    const parsed = schema.safeParse(request.props ?? {})
    if (!parsed.success) {
      throw new InvalidProps(
        request.componentName,
        request.props ?? {},
        parsed.error.format(),
      )
    }
    return parsed.data as z.output<Schema>
  })
}

/** Constructor policy: object pin labels require pin-number keys; arrays do not. */
export function validateComponentPinLabelKeysEffect(request: {
  pinLabels?: Record<string, unknown> | readonly unknown[]
  componentName: string
  originalProps: unknown
}) {
  return coreSync(() => {
    if (!request.pinLabels || Array.isArray(request.pinLabels)) return
    const invalidPinKey = Object.keys(request.pinLabels).find(
      (pinKey) => getPinNumberFromPinLabelsKey(pinKey) === null,
    )
    if (invalidPinKey) {
      throw new InvalidProps(request.componentName, request.originalProps, {
        _errors: [],
        pinLabels: {
          _errors: [
            `Invalid pinLabels key "${invalidPinKey}". Expected "pin\${number}" (e.g. pin1, pin2).`,
          ],
        },
      } as z.ZodFormattedError<{ pinLabels: unknown }>)
    }
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
