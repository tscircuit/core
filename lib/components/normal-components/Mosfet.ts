import { mosfetProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import type { BaseSymbolName } from "lib/utils/constants"
import type { SchSymbol } from "schematic-symbols"
import { getTransformedMosfetSymbol } from "./get-transformed-mosfet-symbol"
import { renderTransformedMosfetSymbol } from "./render-transformed-mosfet-symbol"

export class Mosfet extends NormalComponent<typeof mosfetProps> {
  private transformedSymbolTextIds: string[] = []
  private transformedSymbolInitialCenter: { x: number; y: number } | null = null

  get config() {
    const mosfetMode = this.props.mosfetMode === "depletion" ? "d" : "e"
    const channelType = this.props.channelType
    const baseSymbolName: BaseSymbolName = `${channelType}_channel_${mosfetMode}_mosfet_transistor`

    return {
      componentName: "Mosfet",
      schematicSymbolName: (this.props.symbolName ??
        baseSymbolName) as BaseSymbolName,
      zodProps: mosfetProps,
      shouldRenderAsSchematicBox: false,
    }
  }

  initPorts() {
    super.initPorts()

    const transformedSymbol = getTransformedMosfetSymbol(this._parsedProps)
    if (!transformedSymbol) return

    const ports = this._getAllPortsFromChildren()
    for (const symbolPort of transformedSymbol.ports) {
      const port = ports.find((candidatePort) =>
        candidatePort
          .getNameAndAliases()
          .some((label) => symbolPort.labels.includes(label)),
      )
      if (port) port.schematicSymbolPortDef = symbolPort
    }
  }

  getSchematicSymbol(): SchSymbol | null {
    return (
      getTransformedMosfetSymbol(this._parsedProps) ??
      super.getSchematicSymbol()
    )
  }

  _doInitialSchematicComponentRenderWithSymbol() {
    const transformedSymbol = getTransformedMosfetSymbol(this._parsedProps)
    if (!transformedSymbol) {
      super._doInitialSchematicComponentRenderWithSymbol()
      return
    }

    const renderResult = renderTransformedMosfetSymbol(this, transformedSymbol)
    if (renderResult) {
      this.transformedSymbolTextIds = renderResult.textIds
      this.transformedSymbolInitialCenter = renderResult.initialCenter
    }
  }

  doInitialSchematicSectionRender() {
    if (
      !this.schematic_component_id ||
      !this.transformedSymbolInitialCenter ||
      this.transformedSymbolTextIds.length === 0
    ) {
      return
    }

    const { db } = this.root!
    const component = db.schematic_component.get(this.schematic_component_id)
    if (!component) return

    const deltaX = component.center.x - this.transformedSymbolInitialCenter.x
    const deltaY = component.center.y - this.transformedSymbolInitialCenter.y
    for (const textId of this.transformedSymbolTextIds) {
      const text = db.schematic_text.get(textId)
      if (!text) continue
      db.schematic_text.update(textId, {
        position: {
          x: text.position.x + deltaX,
          y: text.position.y + deltaY,
        },
      })
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_mosfet",
      name: this.name,
      mosfet_mode: props.mosfetMode,
      channel_type: props.channelType,
      display_name: props.displayName,
    } as any)
    this.source_component_id = source_component.source_component_id
  }
}
