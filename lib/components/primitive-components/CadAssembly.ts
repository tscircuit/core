import { cadassemblyProps } from "@tscircuit/props";
import { PrimitiveComponent } from "../base-components/PrimitiveComponent";

export class CadAssembly extends PrimitiveComponent<typeof cadassemblyProps> {
  isPrimitiveContainer = true;
  get config() {
    return {
      componentName: "CadAssembly",
      zodProps: cadassemblyProps,
    };
  }
}
