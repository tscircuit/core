import { Footprint } from "../primitive-components/Footprint"
import { ZodType, z } from "zod"
import { PrimitiveComponent } from "./PrimitiveComponent"
import { Port } from "../primitive-components/Port"
import { symbols, type BaseSymbolName, type SchSymbol } from "schematic-symbols"
import { fp } from "footprinter"
import {
  isValidElement as isReactElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react"
import {
  createInstanceFromReactElement,
  type ReactSubtree,
} from "lib/fiber/create-instance-from-react-element"
import { getPortFromHints } from "lib/utils/getPortFromHints"
import { createComponentsFromSoup } from "lib/utils/createComponentsFromSoup"
import { Net } from "../primitive-components/Net"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"

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
    if (config.schematicSymbolName) {
      const sym = symbols[
        `${config.schematicSymbolName}_horz` as keyof typeof symbols
      ] as SchSymbol | undefined
      if (!sym) return

      for (const symPort of sym.ports) {
        const port = getPortFromHints(symPort.labels)

        if (port) {
          port.schematicSymbolPortDef = symPort
          this.add(port)
        }
      }

      return
    }

    const portsFromFootprint = this.getPortsFromFootprint()

    this.addAll(portsFromFootprint)

    const pinLabels: Record<string, string> | undefined =
      this._parsedProps.pinLabels
    if (pinLabels) {
      for (let [pinNumber, label] of Object.entries(pinLabels)) {
        pinNumber = pinNumber.replace("pin", "")
        const port = this.selectOne(`port[pinNumber='${pinNumber}']`)
        if (!port) {
          throw new Error(
            `Could not find port for pin number ${pinNumber} in chip ${this.getString()}`,
          )
        }
        port.externallyAddedAliases.push(label)
        port.props.name = label
      }
    }
  }

  _addChildrenFromStringFootprint() {
    const { footprint } = this.props
    if (!footprint) return
    if (typeof footprint === "string") {
      const fpSoup = fp.string(footprint).soup()
      const fpComponents = createComponentsFromSoup(fpSoup)
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
    const { db } = this.project!
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
    const { db } = this.project!
    const { schematicSymbolName } = this.config
    if (!schematicSymbolName) return
    // TODO switch between horizontal and vertical based on schRotation
    const symbol_name = `${this.config.schematicSymbolName}_horz`

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
    const { db } = this.project!
    const { _parsedProps: props } = this
    const pcb_component = db.pcb_component.insert({
      center: { x: this.props.pcbX ?? 0, y: this.props.pcbY ?? 0 },
      // width/height are computed in the PcbAnalysis phase
      width: 0,
      height: 0,
      layer: props.layer ?? "top",
      rotation: props.pcbRotation ?? 0,
      source_component_id: this.source_component_id!,
    })
    this.pcb_component_id = pcb_component.pcb_component_id
  }

  doInitialPcbAnalysis(): void {
    const { db } = this.project!
    const { _parsedProps: props } = this

    // TODO Examine children to compute width/height and pcbX/pcbY
  }

  _renderReactSubtree(element: ReactElement): ReactSubtree {
    return {
      element,
      component: createInstanceFromReactElement(element),
    }
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

  add(componentOrElm: PrimitiveComponent | ReactElement) {
    let component: PrimitiveComponent
    if (isReactElement(componentOrElm)) {
      const subtree = this._renderReactSubtree(componentOrElm)
      this.reactSubtrees.push(subtree)
      component = subtree.component
    } else {
      component = componentOrElm as PrimitiveComponent
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
}
