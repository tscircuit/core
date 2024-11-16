import { fp } from "@tscircuit/footprinter"
import type {
  CadModelJscad,
  CadModelObj,
  CadModelProp,
  CadModelStl,
  SchematicPortArrangement,
  SupplierPartNumbers,
} from "@tscircuit/props"
import { point3, rotation } from "circuit-json"
import Debug from "debug"
import {
  type ReactSubtree,
  createInstanceFromReactElement,
} from "lib/fiber/create-instance-from-react-element"
import { underscorifyPinStyles } from "lib/soup/underscorifyPinStyles"
import { underscorifyPortArrangement } from "lib/soup/underscorifyPortArrangement"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"
import { createComponentsFromSoup } from "lib/utils/createComponentsFromSoup"
import { getBoundsOfPcbComponents } from "lib/utils/get-bounds-of-pcb-components"
import {
  getPinNumberFromLabels,
  getPortFromHints,
} from "lib/utils/getPortFromHints"
import {
  type SchematicBoxDimensions,
  getAllDimensionsForSchematicBox,
  isExplicitPinMappingArrangement,
} from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import {
  type ReactElement,
  isValidElement as isReactElement,
  isValidElement,
} from "react"
import { type SchSymbol, symbols } from "schematic-symbols"
import { ZodType, z } from "zod"
import { Footprint } from "../primitive-components/Footprint"
import { Port } from "../primitive-components/Port"
import { PrimitiveComponent } from "./PrimitiveComponent"
import { parsePinNumberFromLabelsOrThrow } from "lib/utils/schematic/parsePinNumberFromLabelsOrThrow"

const debug = Debug("tscircuit:core")

const rotation3 = z.object({
  x: rotation,
  y: rotation,
  z: rotation,
})

export type PortMap<T extends string> = {
  [K in T]: Port
}

/**
 * A NormalComponent is the base class for most components that a user will
 * interact with. It has the ability to set a footprint and discover ports.
 *
 * When you're extending a NormalComponent, you almost always want to override
 * initPorts() to create ports for the component.
 *
 * class Led extends NormalComponent<typeof resistorProps> {
 *   pin1: Port = this.portMap.pin1
 *   pin2: Port = this.portMap.pin2
 *
 *   initPorts() {
 *     this.add(new Port({ pinNumber: 1, aliases: ["anode", "pos"] }))
 *     this.add(new Port({ pinNumber: 2, aliases: ["cathode", "neg"] }))
 *   }
 * }
 */

export class NormalComponent<
  ZodProps extends ZodType = any,
  PortNames extends string = never,
> extends PrimitiveComponent<ZodProps> {
  reactSubtrees: Array<ReactSubtree> = []
  _impliedFootprint?: string | undefined

  isPrimitiveContainer = true

  _asyncSupplierPartNumbers?: SupplierPartNumbers
  pcb_missing_footprint_error_id?: string

  constructor(props: z.input<ZodProps>) {
    super(props)
    this._addChildrenFromStringFootprint()
    this.initPorts()
  }

  /**
   * Override this method for better control over the auto-discovery of ports.
   *
   * If you override this method just do something like:
   * initPorts() {
   *   this.add(new Port({ pinNumber: 1, aliases: ["anode", "pos"] }))
   *   this.add(new Port({ pinNumber: 2, aliases: ["cathode", "neg"] }))
   * }
   *
   * By default, we'll pull the ports from the first place we find them:
   * 1. `config.schematicSymbolName`
   * 2. `props.footprint`
   *
   */
  initPorts(
    opts: {
      additionalAliases?: Record<`pin${number}`, string[]>
    } = {},
  ) {
    const { config } = this
    const portsToCreate: Port[] = []

    // Handle schPortArrangement
    const schPortArrangement = this._parsedProps.schPortArrangement as any
    if (schPortArrangement && !this._parsedProps.pinLabels) {
      for (const side in schPortArrangement) {
        const pins = schPortArrangement[side].pins
        if (Array.isArray(pins)) {
          for (const pinNumberOrLabel of pins) {
            const pinNumber = parsePinNumberFromLabelsOrThrow(
              pinNumberOrLabel,
              this._parsedProps.pinLabels,
            )

            portsToCreate.push(
              new Port(
                {
                  pinNumber,
                  aliases: opts.additionalAliases?.[`pin${pinNumber}`] ?? [],
                },
                {
                  originDescription: `schPortArrangement:${side}`,
                },
              ),
            )
          }
        }
      }
      // Takes care of the case where the user only specifies the size of the
      // sides, and not the pins
      const sides = ["left", "right", "top", "bottom"]
      let pinNum = 1
      for (const side of sides) {
        const size = schPortArrangement[`${side}Size`]
        for (let i = 0; i < size; i++) {
          portsToCreate.push(
            new Port(
              {
                pinNumber: pinNum++,
                aliases: opts.additionalAliases?.[`pin${pinNum}`] ?? [],
              },
              {
                originDescription: `schPortArrangement:${side}`,
              },
            ),
          )
        }
      }
    }

    const pinLabels: Record<string, string | string[]> | undefined =
      this._parsedProps.pinLabels
    if (pinLabels) {
      for (let [pinNumber, label] of Object.entries(pinLabels)) {
        pinNumber = pinNumber.replace("pin", "")
        let existingPort = portsToCreate.find(
          (p) => p._parsedProps.pinNumber === Number(pinNumber),
        )
        const primaryLabel = Array.isArray(label) ? label[0] : label
        const otherLabels = Array.isArray(label) ? label.slice(1) : []

        if (!existingPort) {
          existingPort = new Port(
            {
              pinNumber: parseInt(pinNumber),
              name: primaryLabel,
              aliases: [
                ...otherLabels,
                ...(opts.additionalAliases?.[`pin${parseInt(pinNumber)}`] ??
                  []),
              ],
            },
            {
              originDescription: `pinLabels:pin${pinNumber}`,
            },
          )
          portsToCreate.push(existingPort)
        } else {
          existingPort.externallyAddedAliases.push(primaryLabel, ...otherLabels)
          existingPort.props.name = primaryLabel
        }
      }
    }

    if (config.schematicSymbolName) {
      const sym = symbols[this._getSchematicSymbolNameOrThrow()]
      if (!sym) return

      for (const symPort of sym.ports) {
        const pinNumber = getPinNumberFromLabels(symPort.labels)
        if (!pinNumber) continue
        const port = getPortFromHints(
          symPort.labels.concat(
            opts.additionalAliases?.[`pin${pinNumber}`] ?? [],
          ),
        )

        if (port) {
          port.originDescription = `schematicSymbol:labels[0]:${symPort.labels[0]}`
          port.schematicSymbolPortDef = symPort
          portsToCreate.push(port)
        }
      }

      this.addAll(portsToCreate)
      return
    }

    if (!this._parsedProps.schPortArrangement) {
      const portsFromFootprint = this.getPortsFromFootprint()
      for (const port of portsFromFootprint) {
        if (
          !portsToCreate.some((p) =>
            p.isMatchingAnyOf(port.getNameAndAliases()),
          )
        ) {
          portsToCreate.push(port)
        }
      }
    }

    // Add ports that we know must exist because we know the pin count and
    // missing pin numbers, and they are inside the pins array of the
    // schPortArrangement
    for (let pn = 1; pn <= this._getPinCount(); pn++) {
      if (!this._parsedProps.schPortArrangement) continue
      if (portsToCreate.find((p) => p._parsedProps.pinNumber === pn)) continue
      let explicitlyListedPinNumbersInSchPortArrangement = [
        ...(this._parsedProps.schPortArrangement?.leftSide?.pins ?? []),
        ...(this._parsedProps.schPortArrangement?.rightSide?.pins ?? []),
        ...(this._parsedProps.schPortArrangement?.topSide?.pins ?? []),
        ...(this._parsedProps.schPortArrangement?.bottomSide?.pins ?? []),
      ].map((pn) =>
        parsePinNumberFromLabelsOrThrow(pn, this._parsedProps.pinLabels),
      )

      if (
        [
          "leftSize",
          "rightSize",
          "topSize",
          "bottomSize",
          "leftPinCount",
          "rightPinCount",
          "topPinCount",
          "bottomPinCount",
        ].some((key) => key in this._parsedProps.schPortArrangement)
      ) {
        explicitlyListedPinNumbersInSchPortArrangement = Array.from(
          { length: this._getPinCount() },
          (_, i) => i + 1,
        )
      }

      if (!explicitlyListedPinNumbersInSchPortArrangement.includes(pn)) {
        continue
      }

      portsToCreate.push(
        new Port(
          {
            pinNumber: pn,
            aliases: opts.additionalAliases?.[`pin${pn}`] ?? [],
          },
          {
            originDescription: `notOtherwiseAddedButDeducedFromPinCount:${pn}`,
          },
        ),
      )
    }

    // If no ports were created, don't throw an error
    if (portsToCreate.length > 0) {
      this.addAll(portsToCreate)
    }
  }

  _getImpliedFootprintString(): string | null {
    return null
  }

  _addChildrenFromStringFootprint() {
    let { footprint } = this.props
    footprint ??= this._getImpliedFootprintString?.()
    if (!footprint) return

    if (typeof footprint === "string") {
      const fpSoup = fp.string(footprint).soup()
      const fpComponents = createComponentsFromSoup(fpSoup as any) // Remove as any when footprinter gets updated
      this.addAll(fpComponents)
    }
  }

  get portMap(): PortMap<PortNames> {
    return new Proxy(
      {},
      {
        get: (target, prop): Port => {
          const port = this.children.find(
            (c) =>
              c.componentName === "Port" &&
              (c as Port).isMatchingNameOrAlias(prop as string),
          )
          if (!port) {
            throw new Error(
              `There was an issue finding the port "${prop.toString()}" inside of a ${
                this.componentName
              } component with name: "${
                this.props.name
              }". This is a bug in @tscircuit/core`,
            )
          }
          return port as Port
        },
      },
    ) as any
  }

  getInstanceForReactElement(element: ReactElement): NormalComponent | null {
    for (const subtree of this.reactSubtrees) {
      if (subtree.element === element) return subtree.component
    }
    return null
  }

  doInitialSourceRender() {
    const ftype = this.config.sourceFtype
    if (!ftype) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype,
      name: props.name,
      manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
      supplier_part_numbers: props.supplierPartNumbers,
    })
    this.source_component_id = source_component.source_component_id
  }

  /**
   * Render the schematic component for this NormalComponent using the
   * config.schematicSymbolName if it exists, or create a generic box if
   * no symbol is defined.
   *
   * You can override this method to do more complicated things.
   */
  doInitialSchematicComponentRender() {
    const { schematicSymbolName } = this.config
    if (schematicSymbolName) {
      return this._doInitialSchematicComponentRenderWithSymbol()
    }

    const dimensions = this._getSchematicBoxDimensions()
    if (dimensions) {
      return this._doInitialSchematicComponentRenderWithSchematicBoxDimensions()
    }

    // No schematic symbol or dimensions defined, this could be a board, group
    // or other NormalComponent that doesn't have a schematic representation
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    return undefined
  }

  _doInitialSchematicComponentRenderWithSymbol() {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const symbol_name = this._getSchematicSymbolNameOrThrow()

    const symbol: SchSymbol | undefined = symbols[symbol_name]

    if (symbol) {
      const schematic_component = db.schematic_component.insert({
        center: { x: props.schX ?? 0, y: props.schY ?? 0 },
        rotation: props.schRotation ?? 0,
        size: symbol.size,
        source_component_id: this.source_component_id!,

        symbol_name,

        symbol_display_value: this._getSchematicSymbolDisplayValue(),
      })
      this.schematic_component_id = schematic_component.schematic_component_id
    }
  }

  _doInitialSchematicComponentRenderWithSchematicBoxDimensions() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const dimensions = this._getSchematicBoxDimensions()!

    const primaryPortLabels: Record<string, string> = {}
    for (const [port, label] of Object.entries(props.pinLabels ?? {})) {
      primaryPortLabels[port] = Array.isArray(label) ? label[0] : label
    }

    const schematic_component = db.schematic_component.insert({
      center: { x: props.schX ?? 0, y: props.schY ?? 0 },
      rotation: props.schRotation ?? 0,
      size: dimensions.getSize(),

      port_arrangement: underscorifyPortArrangement(
        props.schPortArrangement as any,
      ),

      pin_spacing: props.schPinSpacing ?? 0.2,

      // @ts-ignore soup needs to support distance for pin_styles
      pin_styles: underscorifyPinStyles(props.schPinStyle),

      port_labels: primaryPortLabels,

      source_component_id: this.source_component_id!,
    })

    this.schematic_component_id = schematic_component.schematic_component_id
  }

  doInitialPcbComponentRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const pcb_component = db.pcb_component.insert({
      center: this._getGlobalPcbPositionBeforeLayout(),
      // width/height are computed in the PcbComponentSizeCalculation phase
      width: 0,
      height: 0,
      layer: props.layer ?? "top",
      rotation: props.pcbRotation ?? 0,
      source_component_id: this.source_component_id!,
    })

    if (!props.footprint) {
      const footprint_error = db.pcb_missing_footprint_error.insert({
        message: `No footprint found for component: ${this.componentName}`,
        source_component_id: `${this.source_component_id}`,
        error_type: "pcb_missing_footprint_error",
      })

      this.pcb_missing_footprint_error_id =
        footprint_error.pcb_missing_footprint_error_id
    }
    this.pcb_component_id = pcb_component.pcb_component_id
  }

  /**
   * At this stage, the smtpads/pcb primitives are placed, so we can compute
   * the width/height of the component
   */
  doInitialPcbComponentSizeCalculation(): void {
    if (!this.pcb_component_id) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const bounds = getBoundsOfPcbComponents(this.children)

    if (bounds.width === 0 || bounds.height === 0) return

    const center = {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    }

    db.pcb_component.update(this.pcb_component_id!, {
      center,
      width: bounds.width,
      height: bounds.height,
    })
  }

  _renderReactSubtree(element: ReactElement): ReactSubtree {
    return {
      element,
      component: createInstanceFromReactElement(element),
    }
  }

  doInitialInitializePortsFromChildren(): void {
    this.initPorts()
  }

  doInitialReactSubtreesRender(): void {
    if (isReactElement(this.props.footprint)) {
      if (this.reactSubtrees.some((rs) => rs.element === this.props.footprint))
        return
      const subtree = this._renderReactSubtree(this.props.footprint)
      this.reactSubtrees.push(subtree)
      this.add(subtree.component)
    }
  }

  _hasExistingPortExactly(port1: Port): boolean {
    const existingPorts = this.children.filter(
      (c) => c.componentName === "Port",
    ) as Port[]
    return existingPorts.some((port2) => {
      const aliases1 = port1.getNameAndAliases()
      const aliases2 = port2.getNameAndAliases()
      return (
        aliases1.length === aliases2.length &&
        aliases1.every((alias) => aliases2.includes(alias))
      )
    })
  }

  add(componentOrElm: PrimitiveComponent | ReactElement) {
    let component: PrimitiveComponent
    if (isReactElement(componentOrElm)) {
      const subtree = this._renderReactSubtree(componentOrElm)
      this.reactSubtrees.push(subtree)
      component = subtree.component
    } else {
      component = componentOrElm as PrimitiveComponent
    }

    if (component.componentName === "Port") {
      if (this._hasExistingPortExactly(component as Port)) return
      // Check if this port is already contained in the children, skip if it's
      // already defined
      const existingPorts = this.children.filter(
        (c) => c.componentName === "Port",
      ) as Port[]
      const conflictingPort = existingPorts.find((p) =>
        p.isMatchingAnyOf(component.getNameAndAliases()),
      )
      if (conflictingPort) {
        debug(
          `Similar ports added. Port 1: ${conflictingPort}, Port 2: ${component}`,
        )
      }
    }

    super.add(component)
  }

  getPortsFromFootprint(): Port[] {
    let { footprint } = this.props

    if (!footprint || isValidElement(footprint)) {
      footprint = this.children.find((c) => c.componentName === "Footprint")
    }

    if (typeof footprint === "string") {
      const fpSoup = fp.string(footprint).soup()

      const newPorts: Port[] = []
      for (const elm of fpSoup) {
        if ("port_hints" in elm && elm.port_hints) {
          const newPort = getPortFromHints(elm.port_hints)
          if (!newPort) continue
          newPort.originDescription = `footprint:string:${footprint}:port_hints[0]:${elm.port_hints[0]}`
          newPorts.push(newPort)
        }
      }

      return newPorts
    }
    if (
      !isValidElement(footprint) &&
      footprint &&
      footprint.componentName === "Footprint"
    ) {
      const fp = footprint as Footprint

      let pinNumber = 1
      const newPorts: Port[] = []
      for (const fpChild of fp.children) {
        if (!fpChild.props.portHints) continue

        let portHintsList = fpChild.props.portHints
        const hasPinPrefix = portHintsList.some((hint: string) =>
          hint.startsWith("pin"),
        )
        if (!hasPinPrefix) {
          portHintsList = [...portHintsList, `pin${pinNumber}`]
        }
        pinNumber++
        const newPort = getPortFromHints(portHintsList)
        if (!newPort) continue
        newPort.originDescription = `footprint:${footprint}`
        newPorts.push(newPort)
      }

      // If no ports were found, return an empty array instead of throwing an error
      return newPorts
    }

    // Explore children for possible smtpads etc.
    const newPorts: Port[] = []
    if (!footprint) {
      for (const child of this.children) {
        if (child.props.portHints && child.isPcbPrimitive) {
          const port = getPortFromHints(child.props.portHints)
          if (port) newPorts.push(port)
        }
      }
    }

    return newPorts
  }

  getPortsFromSchematicSymbol(): Port[] {
    const { config } = this
    if (!config.schematicSymbolName) return []
    const symbol: SchSymbol = (symbols as any)[config.schematicSymbolName]
    if (!symbol) return []
    const newPorts: Port[] = []
    for (const symbolPort of symbol.ports) {
      const port = getPortFromHints(symbolPort.labels)
      if (port) {
        port.schematicSymbolPortDef = symbolPort
        newPorts.push(port)
      }
    }
    return newPorts
  }

  _createNetsFromProps(propsWithConnections: (string | undefined | null)[]) {
    createNetsFromProps(this, propsWithConnections)
  }

  /**
   * Use data from our props to create ports for this component.
   *
   * Generally, this is done by looking at the schematic and the footprint,
   * reading the pins, making sure there aren't duplicates.
   *
   * Can probably be removed in favor of initPorts()
   *
   */
  doInitialPortDiscovery(): void {
    const { _parsedProps: props } = this

    // Only get ports from footprint and schematic if no schPortArrangement
    let newPorts: Port[] = []
    if (!props.schPortArrangement) {
      newPorts = [
        ...this.getPortsFromFootprint(),
        ...this.getPortsFromSchematicSymbol(),
      ]
    }

    const existingPorts = this.children.filter(
      (c) => c.componentName === "Port",
    ) as Port[]

    for (const newPort of newPorts) {
      const existingPort = existingPorts.find((p) =>
        p.isMatchingAnyOf(newPort.getNameAndAliases()),
      )
      if (existingPort) {
        if (
          !existingPort.schematicSymbolPortDef &&
          newPort.schematicSymbolPortDef
        ) {
          existingPort.schematicSymbolPortDef = newPort.schematicSymbolPortDef
        }
        continue
      }
      existingPorts.push(newPort)
      this.add(newPort)
    }
  }

  _getPcbCircuitJsonBounds(): {
    center: { x: number; y: number }
    bounds: { left: number; top: number; right: number; bottom: number }
    width: number
    height: number
  } {
    const { db } = this.root!
    if (!this.pcb_component_id) return super._getPcbCircuitJsonBounds()

    const pcb_component = db.pcb_component.get(this.pcb_component_id)!

    return {
      center: { x: pcb_component.center.x, y: pcb_component.center.y },
      bounds: {
        left: pcb_component.center.x - pcb_component.width / 2,
        top: pcb_component.center.y - pcb_component.height / 2,
        right: pcb_component.center.x + pcb_component.width / 2,
        bottom: pcb_component.center.y + pcb_component.height / 2,
      },
      width: pcb_component.width,
      height: pcb_component.height,
    }
  }

  _getPinCount(): number {
    const schPortArrangement = this._getSchematicPortArrangement()

    // If schPortArrangement exists, use only that for pin count

    if (schPortArrangement) {
      const isExplicitPinMapping =
        isExplicitPinMappingArrangement(schPortArrangement)
      if (!isExplicitPinMapping) {
        return (
          (schPortArrangement.leftSize ??
            schPortArrangement.leftPinCount ??
            0) +
          (schPortArrangement.rightSize ??
            schPortArrangement.rightPinCount ??
            0) +
          (schPortArrangement.topSize ?? schPortArrangement.topPinCount ?? 0) +
          (schPortArrangement.bottomSize ??
            schPortArrangement.bottomPinCount ??
            0)
        )
      }

      const { leftSide, rightSide, topSide, bottomSide } = schPortArrangement
      return Math.max(
        ...(leftSide?.pins ?? []),
        ...(rightSide?.pins ?? []),
        ...(topSide?.pins ?? []),
        ...(bottomSide?.pins ?? []),
      )
    }

    // If no schPortArrangement, fall back to footprint ports
    return this.getPortsFromFootprint().length
  }

  /**
   * Override the schematic port arrangement if you want to customize where pins
   * appear on a schematic box, e.g. for a pin header
   */
  _getSchematicPortArrangement(): SchematicPortArrangement | null {
    return this._parsedProps.schPortArrangement
  }

  _getSchematicBoxDimensions(): SchematicBoxDimensions | null {
    // Only valid if we don't have a schematic symbol
    if (this.getSchematicSymbol()) return null
    if (!this.config.shouldRenderAsSchematicBox) return null

    const { _parsedProps: props } = this

    const pinCount = this._getPinCount()

    const pinSpacing = props.schPinSpacing ?? 0.2

    const dimensions = getAllDimensionsForSchematicBox({
      schWidth: props.schWidth,
      schHeight: props.schHeight,
      schPinSpacing: pinSpacing,
      schPinStyle: props.schPinStyle,

      pinCount,

      schPortArrangement: this._getSchematicPortArrangement()!,
      pinLabels: props.pinLabels,
    })

    return dimensions
  }

  doInitialCadModelRender(): void {
    const { db } = this.root!
    const { boardThickness = 0 } = this.root?._getBoard() ?? {}
    const cadModel = this._parsedProps.cadModel as CadModelProp | undefined

    if (!this.pcb_component_id) return
    if (!cadModel && !this.props.footprint) return

    // Use post-layout bounds
    const bounds = this._getPcbCircuitJsonBounds()

    const pcb_component = db.pcb_component.get(this.pcb_component_id!)

    if (typeof cadModel === "string") {
      throw new Error("String cadModel not yet implemented")
    }

    const rotationOffset = rotation3.parse({
      x: 0,
      y: 0,
      z:
        typeof cadModel?.rotationOffset === "number"
          ? cadModel.rotationOffset
          : 0,
      ...(typeof cadModel?.rotationOffset === "object"
        ? (cadModel.rotationOffset ?? {})
        : {}),
    })

    const positionOffset = point3.parse({
      x: 0,
      y: 0,
      z: 0,
      ...(typeof cadModel?.positionOffset === "object"
        ? cadModel.positionOffset
        : {}),
    })

    const computedLayer = this.props.layer === "bottom" ? "bottom" : "top"
    const cad_model = db.cad_component.insert({
      // TODO z maybe depends on layer
      position: {
        x: bounds.center.x + positionOffset.x,
        y: bounds.center.y + positionOffset.y,
        z:
          (computedLayer === "bottom"
            ? -boardThickness / 2
            : boardThickness / 2) + positionOffset.z,
      },
      rotation: {
        x: rotationOffset.x,
        y: (computedLayer === "top" ? 0 : 180) + rotationOffset.y,
        z:
          (pcb_component?.rotation ?? 0) +
          (computedLayer === "bottom" ? 180 : 0) +
          rotationOffset.z,
      },
      pcb_component_id: this.pcb_component_id!,
      source_component_id: this.source_component_id!,
      model_stl_url:
        "stlUrl" in (cadModel ?? {})
          ? (cadModel as CadModelStl).stlUrl
          : undefined,
      model_obj_url:
        "objUrl" in (cadModel ?? {})
          ? (cadModel as CadModelObj).objUrl
          : undefined,
      model_jscad:
        "jscad" in (cadModel ?? {})
          ? (cadModel as CadModelJscad).jscad
          : undefined,

      footprinter_string:
        typeof this.props.footprint === "string" && !cadModel
          ? this.props.footprint
          : undefined,
    })
  }

  doInitialPartsEngineRender(): void {
    const { partsEngine } = this.getSubcircuit()._parsedProps
    if (!partsEngine) return
    const { db } = this.root!

    const source_component = db.source_component.get(this.source_component_id!)
    if (!source_component) return
    if (source_component.supplier_part_numbers) return

    let footprinterString: string | undefined
    if (this.props.footprint && typeof this.props.footprint === "string") {
      footprinterString = this.props.footprint
    }

    const supplierPartNumbersMaybePromise = partsEngine.findPart({
      sourceComponent: source_component,
      footprinterString,
    })

    // Check if it's not a promise
    if (!(supplierPartNumbersMaybePromise instanceof Promise)) {
      db.source_component.update(this.source_component_id!, {
        supplier_part_numbers: supplierPartNumbersMaybePromise,
      })
      return
    }

    this._queueAsyncEffect(async () => {
      this._asyncSupplierPartNumbers = await supplierPartNumbersMaybePromise
      this._markDirty("PartsEngineRender")
    })
  }

  updatePartsEngineRender(): void {
    const { db } = this.root!

    const source_component = db.source_component.get(this.source_component_id!)
    if (!source_component) return
    if (source_component.supplier_part_numbers) return

    if (this._asyncSupplierPartNumbers) {
      db.source_component.update(this.source_component_id!, {
        supplier_part_numbers: this._asyncSupplierPartNumbers,
      })
      return
    }
  }
}
