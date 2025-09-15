import { schematicCellProps } from "@tscircuit/props";
import { PrimitiveComponent } from "../base-components/PrimitiveComponent";

export class SchematicCell extends PrimitiveComponent<
  typeof schematicCellProps
> {
  isSchematicPrimitive = true;
  canHaveTextChildren = true;

  get config() {
    return {
      componentName: "SchematicCell",
      zodProps: schematicCellProps,
    };
  }
}
