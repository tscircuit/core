import { fp } from "@tscircuit/footprinter"
import type {
  CadModelJscad,
  CadModelObj,
  CadModelProp,
  CadModelStl,
} from "@tscircuit/props"
import { rotation } from "circuit-json"
import {
  type ReactSubtree,
  createInstanceFromReactElement,
} from "lib/fiber/create-instance-from-react-element"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"
import { createComponentsFromSoup } from "lib/utils/createComponentsFromSoup"
import { getBoundsOfPcbComponents } from "lib/utils/get-bounds-of-pcb-components"
import { getPortFromHints } from "lib/utils/getPortFromHints"
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

  isPrimitiveContainer = true

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
  initPorts() {
    const { config } = this
    const portsToCreate: Port[] = []

    // Handle schPortArrangement
    const schPortArrangement = this._parsedProps.schPortArrangement as any
    if (schPortArrangement) {
      for (const side in schPortArrangement) {
        const pins = schPortArrangement[side].pins
        if (Array.isArray(pins)) {
          for (const pinNumber of pins) {
            portsToCreate.push(new Port({ pinNumber }))
          }
        }
      }
    }

    const pinLabels: Record<string, string> | undefined =
      this._parsedProps.pinLabels
    if (pinLabels) {
      for (let [pinNumber, label] of Object.entries(pinLabels)) {
        pinNumber = pinNumber.replace("pin", "")
        let existingPort = portsToCreate.find(
          (p) => p._parsedProps.pinNumber === Number(pinNumber),
        )
        if (!existingPort) {
          existingPort = new Port({
            pinNumber: parseInt(pinNumber),
            name: label,
          })
          portsToCreate.push(existingPort)
        } else {
          existingPort.externallyAddedAliases.push(label)
          existingPort.props.name = label
        }
      }
    }

    if (config.schematicSymbolName) {
      const sym = symbols[
        `${config.schematicSymbolName}_horz` as keyof typeof symbols
      ] as SchSymbol | undefined
      if (!sym) return

      for (const symPort of sym.ports) {
        const port = getPortFromHints(symPort.labels)

        if (port) {
          port.schematicSymbolPortDef = symPort
          portsToCreate.push(port)
        }
      }

      this.addAll(portsToCreate)
      return
    }

    const portsFromFootprint = this.getPortsFromFootprint()
    for (const port of portsFromFootprint) {
      if (
        !portsToCreate.some((p) => p.isMatchingAnyOf(port.getNameAndAliases()))
      ) {
        portsToCreate.push(port)
      }
    }

    // If no ports were created, don't throw an error
    if (portsToCreate.length > 0) {
      this.addAll(portsToCreate)
    }
  }

  _addChildrenFromStringFootprint() {
    const { footprint } = this.props
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
              `There was an issue finding the port "${prop.toString()}" inside of a ${this.componentName} component with name: "${this.props.name}". This is a bug in @tscircuit/core`,
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
   * config.schematicSymbolName if it exists.
   *
   * You can override this method to do more complicated things.
   */
  doInitialSchematicComponentRender() {
    const { db } = this.root!
    const { schematicSymbolName } = this.config
    if (!schematicSymbolName) return
    // TODO switch between horizontal and vertical based on schRotation
    const symbol_name = `${this.config.schematicSymbolName}`

    const symbol = (symbols as any)[symbol_name] as SchSymbol | undefined

    if (!symbol) {
      throw new Error(`Could not find schematic-symbol "${symbol_name}"`)
    }

    const schematic_component = db.schematic_component.insert({
      center: { x: this.props.schX ?? 0, y: this.props.schY ?? 0 },
      rotation: this.props.schRotation ?? 0,
      size: symbol.size,
      source_component_id: this.source_component_id!,

      // @ts-ignore
      symbol_name,
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

    db.pcb_component.update(this.pcb_component_id!, {
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
        throw new Error(
          `Conflicting ports added. Port 1: ${conflictingPort}, Port 2: ${component}`,
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

      const newPorts: Port[] = []
      for (const fpChild of fp.children) {
        const newPort = getPortFromHints(fpChild.props.portHints ?? [])
        if (!newPort) continue
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
    const newPorts = [
      ...this.getPortsFromFootprint(),
      ...this.getPortsFromSchematicSymbol(),
    ]

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

    const cad_model = db.cad_component.insert({
      // TODO z maybe depends on layer
      position: {
        x: bounds.center.x,
        y: bounds.center.y,
        z:
          this.props.layer === "bottom"
            ? -boardThickness / 2
            : boardThickness / 2,
      },
      rotation: {
        x: rotationOffset.x,
        y: (this.props.layer === "top" ? 0 : 180) + rotationOffset.y,
        z:
          (pcb_component?.rotation ?? 0) +
          (this.props.layer === "bottom" ? 180 : 0) +
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
}
