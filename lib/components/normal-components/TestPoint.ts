import { testpointProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import {
  FTYPE,
  type BaseSymbolName,
  type PassivePorts,
} from "lib/utils/constants"
export class TestPoint extends NormalComponent<
  typeof testpointProps,
  PassivePorts
> {
  get config() {
    return {
      componentName: "TestPoint",
      schematicSymbolName: (this.props.symbolName ??
        ("testpoint" as BaseSymbolName)) as BaseSymbolName,
      zodProps: testpointProps,
      shouldRenderAsSchematicBox: false,
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_test_point",
      name: props.name,
    } as any)
    this.source_component_id = source_component.source_component_id
  }
}
