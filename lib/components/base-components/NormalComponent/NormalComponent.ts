import { fp } from "@tscircuit/footprinter"
import type {
  CadModelJscad,
  CadModelObj,
  CadModelProp,
  CadModelStl,
  SchematicPortArrangement,
  SupplierPartNumbers,
} from "@tscircuit/props"
import {
  pcb_manual_edit_conflict_warning,
  point3,
  rotation,
  schematic_manual_edit_conflict_warning,
} from "circuit-json"
import Debug from "debug"
import {
  type ReactSubtree,
  createInstanceFromReactElement,
} from "lib/fiber/create-instance-from-react-element"
import { underscorifyPinStyles } from "lib/soup/underscorifyPinStyles"
import { underscorifyPortArrangement } from "lib/soup/underscorifyPortArrangement"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
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
import { Footprint } from "../../primitive-components/Footprint"
import { Port } from "../../primitive-components/Port"
import { PrimitiveComponent } from "../PrimitiveComponent"
import { parsePinNumberFromLabelsOrThrow } from "lib/utils/schematic/parsePinNumberFromLabelsOrThrow"
import { getNumericSchPinStyle } from "lib/utils/schematic/getNumericSchPinStyle"
import type { INormalComponent } from "./INormalComponent"
import { Trace } from "lib/components/primitive-components/Trace/Trace"

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
  >
  extends PrimitiveComponent<ZodProps>
  implements INormalComponent
{
  reactSubtrees: Array<ReactSubtree> = []
  _impliedFootprint?: string | undefined

  isPrimitiveContainer = true

  _asyncSupplierPartNumbers?: SupplierPartNumbers
  pcb_missing_footprint_error_id?: string
  _hasStartedFootprintUrlLoad = false

  /**
   * Override this property for component defaults
   */
  get defaultInternallyConnectedPinNames(): string[][] {
    return []
  }

  get internallyConnectedPinNames(): string[][] {
    return (
      this._parsedProps.internallyConnectedPins ??
      this.defaultInternallyConnectedPinNames
    )
  }

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
      pinCount?: number
    } = {},
  ) {
    if (this.root?.schematicDisabled) return
    const { config } = this
    const portsToCreate: Port[] = []

    // Handle schPortArrangement
    const schPortArrangement = this._getSchematicPortArrangement()
    if (schPortArrangement && !this._parsedProps.pinLabels) {
      for (const side in schPortArrangement) {
        const pins = (schPortArrangement as any)[side].pins
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
        const size = (schPortArrangement as any)[`${side}Size`]
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

        const existingPort = portsToCreate.find(
          (p) => p._parsedProps.pinNumber === Number(pinNumber),
        )

        if (existingPort) {
          existingPort.schematicSymbolPortDef = symPort
        } else {
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
      }

      this.addAll(portsToCreate)
    }

    if (!this._getSchematicPortArrangement()) {
      const portsFromFootprint = this.getPortsFromFootprint(opts)
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
    for (let pn = 1; pn <= (opts.pinCount ?? this._getPinCount()); pn++) {
      if (!schPortArrangement) continue
      if (portsToCreate.find((p) => p._parsedProps.pinNumber === pn)) continue
      let explicitlyListedPinNumbersInSchPortArrangement = [
        ...(schPortArrangement.leftSide?.pins ?? []),
        ...(schPortArrangement.rightSide?.pins ?? []),
        ...(schPortArrangement.topSide?.pins ?? []),
        ...(schPortArrangement.bottomSide?.pins ?? []),
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
        ].some((key) => key in schPortArrangement)
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

  _isFootprintUrl(s: string): boolean {
    return s.startsWith("http://") || s.startsWith("https://")
  }

  _addChildrenFromStringFootprint() {
    const {
      name: componentName,
      pcbRotation: componentRotation,
      pinLabels,
    } = this.props
    let { footprint } = this.props
    footprint ??= this._getImpliedFootprintString?.()
    if (!footprint) return

    if (typeof footprint === "string") {
      if (this._isFootprintUrl(footprint)) return
      const fpSoup = fp.string(footprint).soup()
      const fpComponents = createComponentsFromCircuitJson(
        { componentName, componentRotation, footprint, pinLabels },
        fpSoup as any,
      ) // Remove as any when footprinter gets updated
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
    if (this.root?.schematicDisabled) return
    const { db } = this.root!

    const { schematicSymbolName } = this.config

    if (schematicSymbolName) {
      this._doInitialSchematicComponentRenderWithSymbol()
    } else {
      const dimensions = this._getSchematicBoxDimensions()
      if (dimensions) {
        this._doInitialSchematicComponentRenderWithSchematicBoxDimensions()
      }
    }

    const manualPlacement =
      this.getSubcircuit()?._getSchematicManualPlacementForComponent(this)

    if (
      this.schematic_component_id &&
      (this.props.schX !== undefined || this.props.schY !== undefined) &&
      !!manualPlacement
    ) {
      if (!this.schematic_component_id) {
        return
      }

      const warning = schematic_manual_edit_conflict_warning.parse({
        type: "schematic_manual_edit_conflict_warning",
        schematic_manual_edit_conflict_warning_id: `schematic_manual_edit_conflict_${this.source_component_id}`,
        message: `${this.getString()} has both manual placement and prop coordinates. schX and schY will be used. Remove schX/schY or clear the manual placement.`,
        schematic_component_id: this.schematic_component_id!,
        source_component_id: this.source_component_id!,
        subcircuit_id: this.getSubcircuit()?.subcircuit_id,
      })

      db.schematic_manual_edit_conflict_warning.insert(warning)
    }

    // No schematic symbol or dimensions defined, this could be a board, group
    // or other NormalComponent that doesn't have a schematic representation
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    return undefined
  }

  _getInternallyConnectedPins(): Port[][] {
    if (this.internallyConnectedPinNames.length === 0) return []

    const internallyConnectedPorts: Port[][] = []
    for (const netPortNames of this.internallyConnectedPinNames) {
      const ports: Port[] = []
      for (const portName of netPortNames) {
        ports.push(this.portMap[portName as PortNames] as Port)
      }
      internallyConnectedPorts.push(ports)
    }
    return internallyConnectedPorts
  }

  _doInitialSchematicComponentRenderWithSymbol() {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const symbol_name = this._getSchematicSymbolNameOrThrow()

    const symbol: SchSymbol | undefined = symbols[symbol_name]

    const center = this._getGlobalSchematicPositionBeforeLayout()

    if (symbol) {
      const schematic_component = db.schematic_component.insert({
        center,
        size: symbol.size,
        source_component_id: this.source_component_id!,

        symbol_name,

        symbol_display_value: this._getSchematicSymbolDisplayValue(),
      })
      this.schematic_component_id = schematic_component.schematic_component_id
    }
  }

  _doInitialSchematicComponentRenderWithSchematicBoxDimensions() {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const dimensions = this._getSchematicBoxDimensions()!

    const primaryPortLabels: Record<string, string> = {}
    if (Array.isArray(props.pinLabels)) {
      props.pinLabels.forEach((label: string, index: number) => {
        primaryPortLabels[String(index + 1)] = label
      })
    } else {
      for (const [port, label] of Object.entries(props.pinLabels ?? {})) {
        primaryPortLabels[port] = Array.isArray(label) ? label[0] : label
      }
    }
    const center = this._getGlobalSchematicPositionBeforeLayout()
    const schPortArrangement = this._getSchematicPortArrangement()
    const schematic_component = db.schematic_component.insert({
      center,
      rotation: props.schRotation ?? 0,
      size: dimensions.getSize(),
      // We should be using the full size, but circuit-to-svg incorrectly
      // uses the schematic_component size to draw boxes instead of the
      // schematic_box size
      // size: dimensions.getSizeIncludingPins(),

      port_arrangement: underscorifyPortArrangement(schPortArrangement!),

      pin_spacing: props.schPinSpacing ?? 0.2,

      // @ts-ignore soup needs to support distance for pin_styles
      pin_styles: underscorifyPinStyles(props.schPinStyle, props.pinLabels),

      port_labels: primaryPortLabels,

      source_component_id: this.source_component_id!,
    })
    const hasTopOrBottomPins =
      schPortArrangement?.topSide !== undefined ||
      schPortArrangement?.bottomSide !== undefined
    const schematic_box_width = dimensions?.getSize().width
    const schematic_box_height = dimensions?.getSize().height
    const manufacturer_part_number_schematic_text = db.schematic_text.insert({
      text: props.manufacturerPartNumber ?? "",
      schematic_component_id: schematic_component.schematic_component_id,
      anchor: "left",
      rotation: 0,
      position: {
        x: hasTopOrBottomPins
          ? center.x + (schematic_box_width ?? 0) / 2 + 0.1
          : center.x - (schematic_box_width ?? 0) / 2,
        y: hasTopOrBottomPins
          ? center.y + (schematic_box_height ?? 0) / 2 + 0.35
          : center.y - (schematic_box_height ?? 0) / 2 - 0.13,
      },
      color: "#006464",
      font_size: 0.18,
    })
    const component_name_text = db.schematic_text.insert({
      text: props.name ?? "",
      schematic_component_id: schematic_component.schematic_component_id,
      anchor: "left",
      rotation: 0,
      position: {
        x: hasTopOrBottomPins
          ? center.x + (schematic_box_width ?? 0) / 2 + 0.1
          : center.x - (schematic_box_width ?? 0) / 2,
        y: hasTopOrBottomPins
          ? center.y + (schematic_box_height ?? 0) / 2 + 0.55
          : center.y + (schematic_box_height ?? 0) / 2 + 0.13,
      },
      color: "#006464",
      font_size: 0.18,
    })
    this.schematic_component_id = schematic_component.schematic_component_id
  }

  doInitialPcbComponentRender() {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const subcircuit = this.getSubcircuit()
    const pcb_component = db.pcb_component.insert({
      center: this._getGlobalPcbPositionBeforeLayout(),
      // width/height are computed in the PcbComponentSizeCalculation phase
      width: 0,
      height: 0,
      layer: props.layer ?? "top",
      rotation: props.pcbRotation ?? 0,
      source_component_id: this.source_component_id!,
      subcircuit_id: subcircuit.subcircuit_id ?? undefined,
    })

    const footprint = props.footprint ?? this._getImpliedFootprintString()

    if (!footprint && !this.isGroup) {
      const footprint_error = db.pcb_missing_footprint_error.insert({
        message: `No footprint found for component: ${this.getString()}`,
        source_component_id: `${this.source_component_id}`,
        error_type: "pcb_missing_footprint_error",
      })

      this.pcb_missing_footprint_error_id =
        footprint_error.pcb_missing_footprint_error_id
    }
    this.pcb_component_id = pcb_component.pcb_component_id

    const manualPlacement =
      this.getSubcircuit()._getPcbManualPlacementForComponent(this)

    if (
      (this.props.pcbX !== undefined || this.props.pcbY !== undefined) &&
      !!manualPlacement
    ) {
      const warning = pcb_manual_edit_conflict_warning.parse({
        type: "pcb_manual_edit_conflict_warning",
        pcb_manual_edit_conflict_warning_id: `pcb_manual_edit_conflict_${this.source_component_id}`,
        message: `${this.getString()} has both manual placement and prop coordinates. pcbX and pcbY will be used. Remove pcbX/pcbY or clear the manual placement.`,
        pcb_component_id: this.pcb_component_id!,
        source_component_id: this.source_component_id!,
        subcircuit_id: subcircuit.subcircuit_id ?? undefined,
      })
      db.pcb_manual_edit_conflict_warning.insert(warning)
    }
  }

  /**
   * At this stage, the smtpads/pcb primitives are placed, so we can compute
   * the width/height of the component
   */
  doInitialPcbComponentSizeCalculation(): void {
    if (this.root?.pcbDisabled) return
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
    // no-op in NormalComponent; sub-classes may override
  }

  doInitialPcbFootprintStringRender(): void {
    let { footprint } = this.props
    footprint ??= this._getImpliedFootprintString?.()
    if (!footprint) return

    const {
      name: componentName,
      pcbRotation: componentRotation,
      pinLabels,
    } = this.props

    if (typeof footprint === "string" && this._isFootprintUrl(footprint)) {
      if (this._hasStartedFootprintUrlLoad) return
      this._hasStartedFootprintUrlLoad = true
      const url = footprint
      this._queueAsyncEffect("load-footprint-url", async () => {
        const res = await fetch(url)
        const soup = await res.json()
        const fpComponents = createComponentsFromCircuitJson(
          { componentName, componentRotation, footprint: url, pinLabels },
          soup as any,
        )
        this.addAll(fpComponents)
        this._markDirty("InitializePortsFromChildren")
      })
      return
    }

    if (isReactElement(footprint)) {
      if (this.reactSubtrees.some((rs) => rs.element === footprint)) return
      const subtree = this._renderReactSubtree(footprint)
      this.reactSubtrees.push(subtree)
      this.add(subtree.component)
      return
    }

    if (
      !isValidElement(footprint) &&
      (footprint as any).componentName === "Footprint"
    ) {
      this.add(footprint as any)
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

  getPortsFromFootprint(opts?: {
    additionalAliases?: Record<string, string[]>
  }): Port[] {
    let { footprint } = this.props

    if (!footprint || isValidElement(footprint)) {
      footprint = this.children.find((c) => c.componentName === "Footprint")
    }

    if (typeof footprint === "string") {
      if (this._isFootprintUrl(footprint)) return []
      const fpSoup = fp.string(footprint).soup()

      const newPorts: Port[] = []
      for (const elm of fpSoup) {
        if ("port_hints" in elm && elm.port_hints) {
          const newPort = getPortFromHints(elm.port_hints, opts)
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
    if (this.root?.schematicDisabled) return []
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

  doInitialCreateNetsFromProps(): void {
    this._createNetsFromProps(this._getNetsFromConnectionsProp())
  }

  _getNetsFromConnectionsProp(): string[] {
    const { _parsedProps: props } = this
    const propsWithConnections: string[] = []
    if (props.connections) {
      for (const [pinName, target] of Object.entries(props.connections)) {
        const targets = Array.isArray(target) ? target : [target]
        for (const targetPath of targets) {
          propsWithConnections.push(targetPath)
        }
      }
    }
    return propsWithConnections
  }

  _createNetsFromProps(propsWithConnections: (string | undefined | null)[]) {
    createNetsFromProps(this, propsWithConnections)
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

  _getPinCountFromSchematicPortArrangement(): number {
    const schPortArrangement = this._getSchematicPortArrangement()
    if (!schPortArrangement) return 0

    const isExplicitPinMapping =
      isExplicitPinMappingArrangement(schPortArrangement)
    if (!isExplicitPinMapping) {
      return (
        (schPortArrangement.leftSize ?? schPortArrangement.leftPinCount ?? 0) +
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

  _getPinCount(): number {
    const schPortArrangement = this._getSchematicPortArrangement()

    // If schPortArrangement exists, use only that for pin count
    if (schPortArrangement) {
      const pinCountFromSchematicPortArrangement =
        this._getPinCountFromSchematicPortArrangement()

      return pinCountFromSchematicPortArrangement
    }

    // If no schPortArrangement, fall back to footprint ports
    return this.getPortsFromFootprint().length
  }

  /**
   * Override the schematic port arrangement if you want to customize where pins
   * appear on a schematic box, e.g. for a pin header
   */
  _getSchematicPortArrangement(): SchematicPortArrangement | null {
    return (
      this._parsedProps.schPinArrangement ??
      this._parsedProps.schPortArrangement
    )
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
      numericSchPinStyle: getNumericSchPinStyle(
        props.schPinStyle,
        props.pinLabels,
      ),

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
    if (cadModel === null) return

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
          computedLayer === "bottom"
            ? -((pcb_component?.rotation ?? 0) + rotationOffset.z) + 180
            : (pcb_component?.rotation ?? 0) + rotationOffset.z,
      },
      pcb_component_id: this.pcb_component_id!,
      source_component_id: this.source_component_id!,
      model_stl_url:
        "stlUrl" in (cadModel ?? {})
          ? this._addCachebustToModelUrl((cadModel as CadModelStl).stlUrl)
          : undefined,
      model_obj_url:
        "objUrl" in (cadModel ?? {})
          ? this._addCachebustToModelUrl((cadModel as CadModelObj).objUrl)
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

  private _addCachebustToModelUrl(url?: string): string | undefined {
    if (!url || !url.includes("modelcdn.tscircuit.com")) return url
    const origin = this.root?.getClientOrigin() ?? ""
    return `${url}${
      url.includes("?") ? "&" : "?"
    }cachebust_origin=${encodeURIComponent(origin)}`
  }

  private _getPartsEngineCacheKey(
    source_component: any,
    footprinterString?: string,
  ): string {
    return JSON.stringify({
      ftype: source_component.ftype,
      name: source_component.name,
      manufacturer_part_number: source_component.manufacturer_part_number,
      footprinterString,
    })
  }

  private async _getSupplierPartNumbers(
    partsEngine: any,
    source_component: any,
    footprinterString: string | undefined,
  ) {
    if (this.props.doNotPlace) return {}
    const cacheEngine = this.root?.platform?.localCacheEngine
    const cacheKey = this._getPartsEngineCacheKey(
      source_component,
      footprinterString,
    )
    if (cacheEngine) {
      const cached = await cacheEngine.getItem(cacheKey)
      if (cached) {
        try {
          return JSON.parse(cached)
        } catch {}
      }
    }
    const result = await Promise.resolve(
      partsEngine.findPart({
        sourceComponent: source_component,
        footprinterString,
      }),
    )

    // Convert "Not found" to empty object before caching or returning
    const supplierPartNumbers = result === "Not found" ? {} : result

    if (cacheEngine) {
      try {
        await cacheEngine.setItem(cacheKey, JSON.stringify(supplierPartNumbers))
      } catch {}
    }
    return supplierPartNumbers
  }

  doInitialPartsEngineRender(): void {
    if (this.props.doNotPlace) return
    const partsEngine = this.getInheritedProperty("partsEngine")
    if (!partsEngine) return
    const { db } = this.root!

    const source_component = db.source_component.get(this.source_component_id!)
    if (!source_component) return
    if (source_component.supplier_part_numbers) return

    let footprinterString: string | undefined
    if (this.props.footprint && typeof this.props.footprint === "string") {
      footprinterString = this.props.footprint
    }

    const supplierPartNumbersMaybePromise = this._getSupplierPartNumbers(
      partsEngine,
      source_component,
      footprinterString,
    )

    if (!(supplierPartNumbersMaybePromise instanceof Promise)) {
      db.source_component.update(this.source_component_id!, {
        supplier_part_numbers: supplierPartNumbersMaybePromise,
      })
      return
    }

    this._queueAsyncEffect("get-supplier-part-numbers", async () => {
      this._asyncSupplierPartNumbers = await supplierPartNumbersMaybePromise
      this._markDirty("PartsEngineRender")
    })
  }

  updatePartsEngineRender(): void {
    if (this.props.doNotPlace) return
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

  doInitialCreateTracesFromProps(): void {
    this._createTracesFromConnectionsProp()
  }

  _createTracesFromConnectionsProp() {
    const { _parsedProps: props } = this

    if (props.connections) {
      for (const [pinName, target] of Object.entries(props.connections)) {
        const targets = Array.isArray(target) ? target : [target]
        for (const targetPath of targets) {
          this.add(
            new Trace({
              from: `${this.getSubcircuitSelector()} > port.${pinName}`,
              to: targetPath as string,
            }),
          )
        }
      }
    }
  }
}
