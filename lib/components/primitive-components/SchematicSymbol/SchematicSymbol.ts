import { schematicSymbolProps } from "@tscircuit/props"
import { type SchSymbol, symbols } from "schematic-symbols"
import { getPinNumberFromLabels } from "../../../utils/getPortFromHints"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import { Port } from "../Port"
import { SchematicSymbol_doInitialSchematicComponentRender } from "./SchematicSymbol_doInitialSchematicComponentRender"
import { SchematicSymbol_doInitialPortMatching } from "./SchematicSymbol_doInitialPortMatching"

export class SchematicSymbol extends PrimitiveComponent<
  typeof schematicSymbolProps
> {
  isSchematicPrimitive = true
  isPrimitiveContainer = true

  get config() {
    return {
      componentName: "SchematicSymbol",
      schematicSymbolName: this.props.symbolName,
      zodProps: schematicSymbolProps,
    }
  }

  initPorts(): void {
    const symbol = symbols[this._getSchematicSymbolNameOrThrow()]!
    const shouldCreateSourcePort = !(
      this._parsedProps.chipRef && this._parsedProps.connections
    )

    for (const symbolPort of symbol.ports) {
      const pinNumber = getPinNumberFromLabels(symbolPort.labels)
      if (!pinNumber) {
        throw new Error(
          `Schematic symbol port must have a numeric pin label: ${symbolPort.labels.join("/")}`,
        )
      }
      const existingPort = this.ports.find(
        (port) => port._parsedProps.pinNumber === pinNumber,
      )
      if (existingPort) {
        existingPort.schematicSymbolPortDef = symbolPort
        continue
      }
      const aliases = symbolPort.labels.filter(
        (label) =>
          label !== pinNumber.toString() && label !== `pin${pinNumber}`,
      )
      const port = new Port(
        {
          pinNumber,
          aliases,
        },
        { shouldCreateSourcePort },
      )
      port.schematicSymbolPortDef = symbolPort
      this.add(port)
    }
  }

  doInitialInitializePortsFromChildren(): void {
    this.initPorts()
  }

  updateInitializePortsFromChildren(): void {
    this.initPorts()
  }

  get ports(): Port[] {
    return this.children.filter((child): child is Port => child instanceof Port)
  }

  getPortForSymbolPort(symbolPort: SchSymbol["ports"][number]): Port | null {
    return (
      this.ports.find((port) => port.schematicSymbolPortDef === symbolPort) ??
      null
    )
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

  doInitialSchematicComponentRender(): void {
    SchematicSymbol_doInitialSchematicComponentRender(this)
  }
}
