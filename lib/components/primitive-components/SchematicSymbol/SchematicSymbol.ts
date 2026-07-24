import { schematicSymbolProps } from "@tscircuit/props"
import type { SchematicPort } from "circuit-json"
import { getRelativeDirection } from "lib/utils/get-relative-direction"
import { getPinNumberFromLabels } from "lib/utils/getPortFromHints"
import { getRotatedSymbolName } from "lib/utils/schematic/getRotatedSymbolName"
import type { SchSymbol } from "schematic-symbols"
import { symbols } from "schematic-symbols"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import type { Port } from "../Port"

type SymbolPort = SchSymbol["ports"][number]

type SymbolPortMapping = {
  symbolPort: SymbolPort
  sourcePorts: Port[]
}

const getConnectionTargets = (
  target: string | string[] | readonly string[],
): string[] => (typeof target === "string" ? [target] : [...target])

const getSymbolPortAliases = (symbolPort: SymbolPort): string[] => {
  const aliases = [...symbolPort.labels]
  const pinNumber = getPinNumberFromLabels(symbolPort.labels)
  if (pinNumber) aliases.push(`pin${pinNumber}`)
  return aliases
}

const symbolPortMatchesKey = (
  symbolPort: SymbolPort,
  connectionKey: string,
): boolean => getSymbolPortAliases(symbolPort).includes(connectionKey)

const getDisplayPinLabel = (symbolPort: SymbolPort): string | undefined =>
  symbolPort.labels.find((label) => !/^(pin)?\d+$/.test(label))

export class SchematicSymbol extends PrimitiveComponent<
  typeof schematicSymbolProps
> {
  isSchematicPrimitive = true

  private _referencedComponent: PrimitiveComponent | null = null
  private _symbolPortMappings: SymbolPortMapping[] = []
  private _hasResolvedMappings = false

  get config() {
    return {
      componentName: "SchematicSymbol",
      schematicSymbolName: this.props.symbolName,
      zodProps: schematicSymbolProps,
    }
  }

  override _getSchematicSymbolName(): keyof typeof symbols | undefined {
    const { symbolName, schRotation } = this._parsedProps
    const normalizedRotation = (((schRotation ?? 0) % 360) + 360) % 360

    if (schRotation !== undefined && normalizedRotation % 90 !== 0) {
      throw new Error(
        `Schematic rotation ${schRotation} is not supported for ${this.componentName}`,
      )
    }

    if (symbolName in symbols) {
      const rotatedSymbolName = getRotatedSymbolName(
        symbolName,
        normalizedRotation,
      )
      if (rotatedSymbolName && rotatedSymbolName in symbols) {
        return rotatedSymbolName as keyof typeof symbols
      }
      return symbolName as keyof typeof symbols
    }

    return super._getSchematicSymbolName()
  }

  private _getComponentPorts(component: PrimitiveComponent): Port[] {
    return component.children.filter(
      (child): child is Port => child.componentName === "Port",
    )
  }

  private _resolveChipRef(): PrimitiveComponent | null {
    const { chipRef } = this._parsedProps
    if (!chipRef) return null

    const subcircuit = this.getSubcircuit()
    const referencedComponent =
      subcircuit.selectOne(chipRef) ??
      (!/[.#\[\] >]/.test(chipRef) ? subcircuit.selectOne(`.${chipRef}`) : null)

    if (!referencedComponent?.source_component_id) {
      throw new Error(
        `Could not resolve chipRef "${chipRef}" for ${this.getString()}`,
      )
    }

    return referencedComponent
  }

  private _resolveGlobalPortSelector(selector: string): Port | null {
    return this.getSubcircuit().selectOne(selector, {
      type: "port",
    }) as Port | null
  }

  private _resolvePortSelector(
    selector: string,
    referencedComponent: PrimitiveComponent | null,
  ): Port | null {
    const globallyResolvedPort = this._resolveGlobalPortSelector(selector)
    if (globallyResolvedPort) return globallyResolvedPort

    if (!referencedComponent || !/^\.?[A-Za-z0-9_-]+$/.test(selector)) {
      return null
    }

    const relativePortName = selector.replace(/^\./, "")
    return (
      this._getComponentPorts(referencedComponent).find((port) =>
        port.isMatchingAnyOf([relativePortName]),
      ) ?? null
    )
  }

  private _inferReferencedComponentFromConnections(): PrimitiveComponent | null {
    const { connections } = this._parsedProps
    if (!connections) return null

    const resolvedComponents = new Map<string, PrimitiveComponent>()
    for (const target of Object.values(connections)) {
      for (const selector of getConnectionTargets(target)) {
        const port = this._resolveGlobalPortSelector(selector)
        const component =
          port?.getParentNormalComponent() as PrimitiveComponent | null
        if (!port || !component?.source_component_id) {
          throw new Error(
            `Could not resolve connection target "${selector}" for ${this.getString()}. Provide chipRef when using a port name relative to a component.`,
          )
        }
        resolvedComponents.set(component.source_component_id, component)
      }
    }

    if (resolvedComponents.size > 1) {
      throw new Error(
        `${this.getString()} connections must reference ports on one physical component`,
      )
    }

    return resolvedComponents.values().next().value ?? null
  }

  private _assertPortsBelongToReferencedComponent(
    ports: Port[],
    referencedComponent: PrimitiveComponent,
  ): void {
    for (const port of ports) {
      const sourcePort = this.root!.db.source_port.get(port.source_port_id!)
      if (
        sourcePort?.source_component_id !==
        referencedComponent.source_component_id
      ) {
        throw new Error(
          `Connection target "${port.getString()}" does not belong to chipRef "${this._parsedProps.chipRef}"`,
        )
      }
    }
  }

  private _expandInternallyConnectedPorts(
    ports: Port[],
    referencedComponent: PrimitiveComponent | null,
  ): Port[] {
    if (!referencedComponent) return ports

    const sourcePortIds = new Set(
      ports
        .map((port) => port.source_port_id)
        .filter((id): id is string => Boolean(id)),
    )
    const internalConnections =
      this.root!.db.source_component_internal_connection.list()

    for (const connection of internalConnections) {
      if (
        connection.source_port_ids.some((sourcePortId) =>
          sourcePortIds.has(sourcePortId),
        )
      ) {
        for (const sourcePortId of connection.source_port_ids) {
          sourcePortIds.add(sourcePortId)
        }
      }
    }

    return this._getComponentPorts(referencedComponent).filter(
      (port) => port.source_port_id && sourcePortIds.has(port.source_port_id),
    )
  }

  private _assertPortsAreInternallyConnected(
    ports: Port[],
    connectionKey: string,
  ): void {
    const sourcePortIds = Array.from(
      new Set(
        ports
          .map((port) => port.source_port_id)
          .filter((id): id is string => Boolean(id)),
      ),
    )
    if (sourcePortIds.length <= 1) return

    const internalConnections =
      this.root!.db.source_component_internal_connection.list()
    const areInternallyConnected = internalConnections.some((connection) =>
      sourcePortIds.every((sourcePortId) =>
        connection.source_port_ids.includes(sourcePortId),
      ),
    )

    if (!areInternallyConnected) {
      throw new Error(
        `Connection "${connectionKey}" on ${this.getString()} maps to multiple physical ports that are not internally connected`,
      )
    }
  }

  private _resolveReferencedComponentAndMappings(): void {
    if (this._hasResolvedMappings) return
    this._hasResolvedMappings = true

    const symbol = this.getSchematicSymbol()
    if (!symbol) {
      this._getSchematicSymbolNameOrThrow()
      return
    }

    const parentComponent =
      this.getParentNormalComponent() as PrimitiveComponent | null
    const parentPhysicalComponent = parentComponent?.source_component_id
      ? parentComponent
      : null

    this._referencedComponent =
      this._resolveChipRef() ??
      parentPhysicalComponent ??
      this._inferReferencedComponentFromConnections()

    const mappingsBySymbolPort = new Map<SymbolPort, Port[]>()
    const { connections } = this._parsedProps

    for (const [connectionKey, target] of Object.entries(connections ?? {})) {
      const matchingSymbolPorts = symbol.ports.filter((symbolPort) =>
        symbolPortMatchesKey(symbolPort, connectionKey),
      )
      if (matchingSymbolPorts.length !== 1) {
        throw new Error(
          `Could not find exactly one port named "${connectionKey}" on schematic symbol "${this._parsedProps.symbolName}"`,
        )
      }

      const resolvedPorts = this._expandInternallyConnectedPorts(
        getConnectionTargets(target).map((selector) => {
          const port = this._resolvePortSelector(
            selector,
            this._referencedComponent,
          )
          if (!port?.source_port_id) {
            throw new Error(
              `Could not resolve connection target "${selector}" for ${this.getString()}`,
            )
          }
          return port
        }),
        this._referencedComponent,
      )
      if (resolvedPorts.length === 0) {
        throw new Error(
          `Connection "${connectionKey}" on ${this.getString()} must reference at least one physical port`,
        )
      }

      if (this._referencedComponent) {
        this._assertPortsBelongToReferencedComponent(
          resolvedPorts,
          this._referencedComponent,
        )
      }
      this._assertPortsAreInternallyConnected(resolvedPorts, connectionKey)
      mappingsBySymbolPort.set(matchingSymbolPorts[0], resolvedPorts)
    }

    if (this._referencedComponent) {
      const componentPorts = this._getComponentPorts(this._referencedComponent)
      for (const symbolPort of symbol.ports) {
        if (mappingsBySymbolPort.has(symbolPort)) continue
        const symbolPortAliases = getSymbolPortAliases(symbolPort)
        const matchingPorts = componentPorts.filter((port) =>
          port.isMatchingAnyOf(symbolPortAliases),
        )
        if (matchingPorts.length === 0) continue
        this._assertPortsAreInternallyConnected(
          matchingPorts,
          symbolPort.labels[0],
        )
        mappingsBySymbolPort.set(symbolPort, matchingPorts)
      }
    }

    this._symbolPortMappings = Array.from(
      mappingsBySymbolPort,
      ([symbolPort, sourcePorts]) => ({
        symbolPort,
        sourcePorts,
      }),
    )
  }

  doInitialSchematicComponentRender(): void {
    if (this.root?.schematicDisabled) return
    if (this.getCollapsedSchematicBoxAncestor()) return

    this._resolveReferencedComponentAndMappings()

    const { db } = this.root!
    const symbolName = this._getSchematicSymbolNameOrThrow()
    const symbol = symbols[symbolName]
    if (!symbol) {
      throw new Error(`No schematic symbol found for "${symbolName}"`)
    }
    const center = this._getGlobalSchematicPositionBeforeLayout()

    const schematicComponent = db.schematic_component.insert({
      center,
      size: { ...symbol.size },
      ...(this._referencedComponent?.source_component_id
        ? {
            source_component_id: this._referencedComponent.source_component_id,
          }
        : {}),
      is_box_with_pins: true,
      symbol_name: symbolName,
      schematic_sheet_id: this._resolveSchematicSheetId(),
    })
    this.schematic_component_id = schematicComponent.schematic_component_id

    /*
     * displayName is intentionally not emitted yet. A SchematicSymbol shares
     * its source_component with every other representation of the same chip,
     * while circuit-to-svg currently reads {REF} from that shared source
     * component. Implement this only after Circuit JSON supports a
     * per-schematic_component display name; mutating the source component or
     * creating a shadow source component would make multi-unit symbols wrong.
     */
  }

  doInitialSchematicPortRender(): void {
    if (this.root?.schematicDisabled || !this.schematic_component_id) return
    if (this.getCollapsedSchematicBoxAncestor()) return

    this._resolveReferencedComponentAndMappings()

    const { db } = this.root!
    const symbol = this.getSchematicSymbol()!
    const center = this._getGlobalSchematicPositionBeforeLayout()
    const schematicSheetId = this._resolveSchematicSheetId()

    for (const { symbolPort, sourcePorts } of this._symbolPortMappings) {
      const sourcePort = sourcePorts[0]
      if (!sourcePort.source_port_id) continue

      const portCenter = {
        x: center.x + symbolPort.x - symbol.center.x,
        y: center.y + symbolPort.y - symbol.center.y,
      }
      const facingDirection = getRelativeDirection(center, portCenter)
      const pinNumber = getPinNumberFromLabels(symbolPort.labels)

      const schematicPort = db.schematic_port.insert({
        schematic_component_id: this.schematic_component_id,
        center: portCenter,
        source_port_id: sourcePort.source_port_id,
        facing_direction: facingDirection as SchematicPort["facing_direction"],
        distance_from_component_edge: 0.4,
        pin_number: pinNumber ? Number(pinNumber) : undefined,
        display_pin_label: getDisplayPinLabel(symbolPort),
        is_connected: false,
        schematic_sheet_id: schematicSheetId,
      })

      for (const mappedSourcePort of sourcePorts) {
        mappedSourcePort.schematic_port_id = schematicPort.schematic_port_id
      }
    }
  }
}
