import { z } from "zod"

export const resolveCompactSchSize = (
  schSize: unknown,
): "sm" | "xs" | undefined => {
  if (schSize === "sm" || schSize === "small") {
    return "sm"
  }
  if (
    schSize === "xs" ||
    schSize === "extra_small" ||
    schSize === "extra-small" ||
    schSize === "xsmall"
  ) {
    return "xs"
  }
  return undefined
}

export const normalizeSchSizeProp = (props: any) => {
  if (!props || typeof props !== "object") return props
  if (props.schSize === "small") {
    return { ...props, schSize: "sm" }
  }
  if (
    props.schSize === "extra_small" ||
    props.schSize === "extra-small" ||
    props.schSize === "xsmall"
  ) {
    return { ...props, schSize: "xs" }
  }
  return props
}

export const withSchSizeNormalization = <T extends z.ZodTypeAny>(
  schema: T,
): T => {
  return z.preprocess(normalizeSchSizeProp, schema) as unknown as T
}
