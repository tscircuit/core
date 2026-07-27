import { schematicSymbolProps } from "@tscircuit/props"
import {
  PrimitiveComponent,
  type ScopedPortSelectorAlias,
} from "../../base-components/PrimitiveComponent"
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

  getScopedPortSelectorAliases(): ScopedPortSelectorAlias[] {
    return this.mappedPorts.map(({ symbolPort, referencedPort }) => ({
      componentAliases: this.getNameAndAliases(),
      portAliases: getConnectionNamesForSymbolPort(symbolPort.labels),
      port: referencedPort,
    }))
  }

  doInitialSchematicComponentRender(): void {
    SchematicSymbol_doInitialSchematicComponentRender(this)
  }
}
