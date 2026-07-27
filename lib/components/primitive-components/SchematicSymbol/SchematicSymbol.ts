import { schematicSymbolProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import type { Port } from "../Port"
import {
  type MappedSchematicSymbolPort,
  SchematicSymbol_doInitialPortMatching,
  getConnectionNamesForSymbolPort,
} from "./SchematicSymbol_doInitialPortMatching"
import { SchematicSymbol_doInitialSchematicComponentRender } from "./SchematicSymbol_doInitialSchematicComponentRender"

export class SchematicSymbol extends PrimitiveComponent<
  typeof schematicSymbolProps
> {
  isSchematicPrimitive = true
  mappedPorts: MappedSchematicSymbolPort[] = []

  get config() {
    return {
      componentName: "SchematicSymbol",
      schematicSymbolName: this.props.symbolName,
      zodProps: schematicSymbolProps,
    }
  }

  doInitialSourceRender(): void {
    const sourceComponent = this.root!.db.source_component.insert({
      ftype: "simple_chip",
      name: this.name,
      display_name: this._parsedProps.displayName,
      are_pins_interchangeable: false,
    })
    this.source_component_id = sourceComponent.source_component_id
  }

  doInitialPortMatching(): void {
    SchematicSymbol_doInitialPortMatching(this)
  }

  _resolveMappedPort(portName: string): Port | null {
    return (
      this.mappedPorts.find(({ symbolPort }) =>
        getConnectionNamesForSymbolPort(symbolPort.labels).includes(portName),
      )?.referencedPort ?? null
    )
  }

  doInitialSchematicComponentRender(): void {
    SchematicSymbol_doInitialSchematicComponentRender(this)
  }
}
