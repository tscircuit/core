import type { z } from "zod"

const constructionSchemas = new WeakMap<z.ZodType, z.ZodType>()

/** Reuse the optional-name schema while still validating every instance. */
export const getConstructionPropsSchema = (schema: z.ZodType): z.ZodType => {
  let constructionSchema = constructionSchemas.get(schema)
  if (!constructionSchema) {
    constructionSchema =
      "partial" in schema
        ? (schema as z.ZodObject<any, any, any>).partial({ name: true })
        : schema
    constructionSchemas.set(schema, constructionSchema)
  }
  return constructionSchema
}
