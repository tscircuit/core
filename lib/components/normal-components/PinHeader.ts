import { pinHeaderProps, type SchematicPortArrangement } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Port } from "../primitive-components/Port"
import type { SourceSimplePinHeader } from "circuit-json"
import type { BaseSymbolName } from "lib/utils/constants"

export class PinHeader extends NormalComponent<typeof pinHeaderProps> {
  get config() {
    return {
      componentName: "PinHeader",
      zodProps: pinHeaderProps,
      shouldRenderAsSchematicBox: true,
    }
  }

  _getImpliedFootprintString(): string | null {
    const pinCount =
      this._parsedProps.pinCount ?? this._parsedProps.pinLabels?.length ?? 0
    const holeDiameter = this._parsedProps.holeDiameter
    const platedDiameter = this._parsedProps.platedDiameter
    const pitch = this._parsedProps.pitch
    const showSilkscreenPinLabels = this._parsedProps.showSilkscreenPinLabels

    if (pinCount > 0) {
      let footprintString: string

      if (pitch) {
        if (!holeDiameter && !platedDiameter) {
          footprintString = `pinrow${pinCount}_p${pitch}`
        } else {
          footprintString = `pinrow${pinCount}_p${pitch}_id${holeDiameter}_od${platedDiameter}`
        }
      } else {
        if (!holeDiameter && !platedDiameter) {
          footprintString = `pinrow${pinCount}`
        } else {
          return null
        }
      }

      // Add _nopinlabels if showSilkscreenPinLabels is false or undefined
      if (showSilkscreenPinLabels !== true) {
        footprintString += "_nopinlabels"
      }

      return footprintString
    }
    return null
  }

  initPorts() {
    const pinCount =
      this._parsedProps.pinCount ?? this._parsedProps.pinLabels?.length ?? 1
    for (let i = 1; i <= pinCount; i++) {
      this.add(
        new Port({
          name: `pin${i}`,
          pinNumber: i,
          aliases: [this._parsedProps.pinLabels?.[i - 1]].filter(
            Boolean,
          ) as string[],
        }),
      )
    }
  }

  _getSchematicPortArrangement(): SchematicPortArrangement | null {
    const pinCount = this._parsedProps.pinCount ?? 1
    const facingDirection =
      this._parsedProps.schFacingDirection ??
      this._parsedProps.facingDirection ??
      "right"
    const schPinArrangement = this._parsedProps.schPinArrangement

    if (facingDirection === "left") {
      return {
        leftSide: {
          direction: schPinArrangement?.leftSide?.direction ?? "top-to-bottom",
          pins:
            schPinArrangement?.leftSide?.pins ??
            Array.from({ length: pinCount }, (_, i) => `pin${i + 1}`),
        },
      }
    }

    return {
      rightSide: {
        direction: schPinArrangement?.rightSide?.direction ?? "top-to-bottom",
        pins:
          schPinArrangement?.rightSide?.pins ??
          Array.from({ length: pinCount }, (_, i) => `pin${i + 1}`),
      },
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_pin_header",
      name: this.name,
      supplier_part_numbers: props.supplierPartNumbers,
      pin_count: props.pinCount,
      gender: props.gender,
      are_pins_interchangeable: true,
    } as SourceSimplePinHeader)
    this.source_component_id = source_component.source_component_id
  }
}
