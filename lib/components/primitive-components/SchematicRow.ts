import { schematicRowProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class SchematicRow extends PrimitiveComponent<typeof schematicRowProps> {
  isSchematicPrimitive = true

  get config() {
    return {
      componentName: "SchematicRow",
      zodProps: schematicRowProps,
    }
  }
}
