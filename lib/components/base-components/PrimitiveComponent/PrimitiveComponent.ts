import type { PcbSx } from "@tscircuit/props"
import type { AnySourceComponent, LayerRef } from "circuit-json"
import { getResolvedPcbSx } from "lib/utils/pcbSx/get-resolved-pcb-sx"
import Debug from "debug"
import { InvalidProps } from "lib/errors/InvalidProps"
import type {
  SchematicBoxComponentDimensions,
  SchematicBoxDimensions,
} from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import { isMatchingSelector } from "lib/utils/selector-matching"
import { type SchSymbol, symbols } from "schematic-symbols"
import {
  type Matrix,
  applyToPoint,
  compose,
  flipY,
  identity,
  rotate,
  translate,
} from "transformation-matrix"
import type { Primitive, ZodType } from "zod"
import { z } from "zod"
import type { RootCircuit } from "lib/RootCircuit"
import type { ISubcircuit } from "lib/components/primitive-components/Group/Subcircuit/ISubcircuit"
import type { ISymbol } from "lib/components/primitive-components/Symbol/ISymbol"
import { Renderable } from "lib/components/base-components/Renderable"
import type { IGroup } from "lib/components/primitive-components/Group/IGroup"
import type { Ftype } from "lib/utils/constants"
import { selectOne, selectAll, type Options } from "css-select"
import type { BoardI } from "lib/components/normal-components/BoardI"
import { evaluateCalcString } from "lib/utils/evaluateCalcString"
import {
  cssSelectPrimitiveComponentAdapter,
  cssSelectPrimitiveComponentAdapterOnlySubcircuits,
  cssSelectPrimitiveComponentAdapterWithoutSubcircuits,
} from "./cssSelectPrimitiveComponentAdapter"
import { preprocessSelector } from "./preprocessSelector"

const cssSelectOptionsInsideSubcircuit: Options<
  PrimitiveComponent,
  PrimitiveComponent
> = {
  adapter: cssSelectPrimitiveComponentAdapterWithoutSubcircuits,
  cacheResults: true,
}

export interface BaseComponentConfig {
  componentName: string
  schematicSymbolName?: string | null
  zodProps: z.ZodType
  sourceFtype?: Ftype | null
  shouldRenderAsSchematicBox?: boolean
}

/**
 * A PrimitiveComponent (SmtPad, Port etc.) doesn't have the ability to contain
 * React subtrees or explicit handling of the "footprint" prop. But otherwise
 * has most of the features of a NormalComponent.
 */
export abstract class PrimitiveComponent<
  ZodProps extends ZodType = any,
> extends Renderable {
  parent: PrimitiveComponent | null = null
  children: PrimitiveComponent[]
  childrenPendingRemoval: PrimitiveComponent[]

  get config(): BaseComponentConfig {
    return {
      componentName: "",
      zodProps: z.object({}).passthrough(),
    }
  }

  props: z.input<ZodProps>
  _parsedProps: z.infer<ZodProps>

  get componentName() {
    return this.config.componentName
  }

  getInheritedProperty(propertyName: string) {
    let current: PrimitiveComponent<ZodProps> | null = this
    while (current) {
      if (current._parsedProps && propertyName in current._parsedProps) {
        return current._parsedProps[propertyName]
      }
      current = current.parent as PrimitiveComponent<ZodProps> | null // Move up to the parent
    }
    if (this.root?.platform && propertyName in this.root.platform) {
      return this.root.platform[propertyName as keyof typeof this.root.platform]
    }
    return undefined // Return undefined if not found
  }

  getInheritedMergedProperty(propertyName: string): any {
    const parentPropertyObject =
      this.parent?.getInheritedMergedProperty?.(propertyName)
    const myPropertyObject =
      this._parsedProps?.[propertyName as keyof z.infer<ZodProps>]
    return { ...parentPropertyObject, ...myPropertyObject }
  }

  getResolvedPcbSx(): PcbSx {
    return getResolvedPcbSx({
      parentResolvedPcbSx: this.parent?.getResolvedPcbSx?.(),
      pcbStyle: this._parsedProps?.pcbStyle,
      ownPcbSx: this._parsedProps?.pcbSx,
    })
  }

  get lowercaseComponentName() {
    return this.componentName.toLowerCase()
  }

  externallyAddedAliases: string[]

  /**
   * An subcircuit is self-contained. All the selectors inside
   * a subcircuit are relative to the subcircuit group. You can have multiple
   * subcircuits and their selectors will not interact with each other (even if the
   * components share the same names) unless you explicitly break out some ports
   */
  get isSubcircuit() {
    return (
      Boolean(this.props.subcircuit) ||
      (this.lowercaseComponentName === "group" && (this?.parent as any)?.isRoot)
    )
  }

  get isGroup() {
    return this.lowercaseComponentName === "group"
  }

  get name() {
    return (this._parsedProps as any).name ?? this.fallbackUnassignedName
  }

  /**
   * A primitive container is a component that contains one or more ports and
   * primitive components that are designed to interact.
   *
   * For example a resistor contains ports and smtpads that interact, so the
   * resistor is a primitive container. Inside a primitive container, the ports
   * and pads are likely to reference each other and look for eachother during
   * the port matching phase.
   *
   */
  isPrimitiveContainer = false
  canHaveTextChildren = false

  source_group_id: string | null = null
  source_component_id: string | null = null
  schematic_component_id: string | null = null
  pcb_component_id: string | null = null
  cad_component_id: string | null = null
  fallbackUnassignedName?: string

  constructor(props: z.input<ZodProps>) {
    super(props)
    this.children = []
    this.childrenPendingRemoval = []
    this.props = props ?? {}
    this.externallyAddedAliases = []
    const zodProps =
      "partial" in this.config.zodProps
        ? (this.config.zodProps as z.ZodObject<any, any, any>).partial({
            name: true,
          })
        : this.config.zodProps
    const parsePropsResult = zodProps.safeParse(props ?? {})
    if (parsePropsResult.success) {
      this._parsedProps = parsePropsResult.data as z.infer<ZodProps>
    } else {
      throw new InvalidProps(
        this.lowercaseComponentName,
        this.props,
        parsePropsResult.error.format(),
      )
    }
  }

  setProps(props: Partial<z.input<ZodProps>>) {
    const newProps = this.config.zodProps.parse({
      ...this.props,
      ...props,
    }) as z.infer<ZodProps>
    const oldProps = this.props
    this.props = newProps
    this._parsedProps = this.config.zodProps.parse(props) as z.infer<ZodProps>
    this.onPropsChange({
      oldProps,
      newProps,
      changedProps: Object.keys(props),
    })
    this.parent?.onChildChanged?.(this)
  }

  _getPcbRotationBeforeLayout(): number | null {
    const { pcbRotation } = this.props as any
    if (typeof pcbRotation === "string") {
      return parseFloat(pcbRotation)
    }
    return pcbRotation ?? null
  }

  getResolvedPcbPositionProp(): { pcbX: number; pcbY: number } {
    return {
      pcbX: this._resolvePcbCoordinate((this._parsedProps as any).pcbX, "pcbX"),
      pcbY: this._resolvePcbCoordinate((this._parsedProps as any).pcbY, "pcbY"),
    }
  }

  protected _resolvePcbCoordinate(
    rawValue: unknown,
    axis: "pcbX" | "pcbY",
    options: { allowBoardVariables?: boolean } = {},
  ): number {
    if (rawValue == null) return 0
    if (typeof rawValue === "number") return rawValue
    if (typeof rawValue !== "string") {
      throw new Error(
        `Invalid ${axis} value for ${this.componentName}: ${String(rawValue)}`,
      )
    }

    const allowBoardVariables =
      options.allowBoardVariables ?? (this as any)._isNormalComponent === true
    const includesBoardVariable = rawValue.includes("board.")
    const knownVariables: Record<string, number> = {}

    if (allowBoardVariables) {
      const board = this._getBoard()
      const boardVariables = board?._getBoardCalcVariables() ?? {}

      if (includesBoardVariable && !board) {
        throw new Error(
          `Cannot resolve ${axis} for ${this.componentName}: no board found for board.* variables`,
        )
      }

      if (
        includesBoardVariable &&
        board &&
        Object.keys(boardVariables).length === 0
      ) {
        throw new Error(
          "Cannot do calculations based on board size when the board is auto-sized",
        )
      }

      Object.assign(knownVariables, boardVariables)
    }

    try {
      return evaluateCalcString(rawValue, { knownVariables })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(
        `Invalid ${axis} value for ${this.componentName}: ${message}`,
      )
    }
  }

  /**
   * Computes a transformation matrix from the props of this component for PCB
   * components
   */
  computePcbPropsTransform(): Matrix {
    const rotation = this._getPcbRotationBeforeLayout() ?? 0
    const { pcbX, pcbY } = this.getResolvedPcbPositionProp()

    const matrix = compose(
      translate(pcbX, pcbY),
      rotate((rotation * Math.PI) / 180),
    )

    return matrix
  }

  /**
   * Compute a transformation matrix combining all parent transforms for PCB
   * components, including this component's translation and rotation.
   *
   * This is used to compute this component's position as well as all children
   * components positions before layout is applied
   */
  _computePcbGlobalTransformBeforeLayout(): Matrix {
    const manualPlacement =
      this.getSubcircuit()._getPcbManualPlacementForComponent(this)

    // pcbX or pcbY will override the manual placement
    if (
      manualPlacement &&
      this.props.pcbX === undefined &&
      this.props.pcbY === undefined
    ) {
      const rotation = this._getPcbRotationBeforeLayout() ?? 0
      return compose(
        this.parent?._computePcbGlobalTransformBeforeLayout() ?? identity(),
        compose(
          translate(manualPlacement.x, manualPlacement.y),
          rotate((rotation * Math.PI) / 180),
        ),
      )
    }

    // If this is a primitive, and the parent primitive container is flipped,
    // we flip it's position
    if (this.isPcbPrimitive) {
      const primitiveContainer = this.getPrimitiveContainer()
      if (primitiveContainer) {
        const isFlipped = primitiveContainer._parsedProps.layer === "bottom"

        if (isFlipped) {
          return compose(
            this.parent?._computePcbGlobalTransformBeforeLayout() ?? identity(),
            flipY(),
            this.computePcbPropsTransform(),
          )
        }
      }
    }

    return compose(
      this.parent?._computePcbGlobalTransformBeforeLayout() ?? identity(),
      this.computePcbPropsTransform(),
    )
  }

  getPrimitiveContainer(): PrimitiveComponent | null {
    if (this.isPrimitiveContainer) return this
    return this.parent?.getPrimitiveContainer?.() ?? null
  }

  /**
   * Get the Symbol ancestor if this component is inside a Symbol primitive container.
   * Used by schematic primitives to access the symbol's resize transform.
   */
  _getSymbolAncestor(): ISymbol | null {
    const container = this.getPrimitiveContainer()
    if (container?.componentName === "Symbol") {
      return container as unknown as ISymbol
    }
    return null
  }

  /**
   * Walk up the component hierarchy to find the nearest NormalComponent ancestor.
   * This is useful for primitive components that need access to component IDs
   * (pcb_component_id, schematic_component_id, source_component_id) from their
   * parent NormalComponent, even when there are intermediate primitive containers
   * like Symbol in the hierarchy.
   */
  getParentNormalComponent(): any | null {
    let current: any = this.parent
    while (current) {
      // NormalComponent has isPrimitiveContainer = true but also has these render methods
      if (current.isPrimitiveContainer && current.doInitialPcbComponentRender) {
        return current
      }
      current = current.parent
    }
    return null
  }

  /**
   * Emit a warning when coveredWithSolderMask is true but solderMaskMargin is also set
   */
  emitSolderMaskMarginWarning(
    isCoveredWithSolderMask: boolean,
    solderMaskMargin: number | undefined,
  ): void {
    if (isCoveredWithSolderMask && solderMaskMargin !== undefined) {
      const parentNormalComponent = this.getParentNormalComponent()
      if (parentNormalComponent?.source_component_id) {
        this.root!.db.source_property_ignored_warning.insert({
          source_component_id: parentNormalComponent.source_component_id,
          property_name: "solderMaskMargin",
          message: `solderMaskMargin is set but coveredWithSolderMask is true. When a component is fully covered with solder mask, a margin doesn't apply.`,
          error_type: "source_property_ignored_warning",
        })
      }
    }
  }

  /**
   * Compute the PCB bounds of this component the circuit json elements
   * associated with it.
   */
  _getPcbCircuitJsonBounds(): {
    center: { x: number; y: number }
    bounds: { left: number; top: number; right: number; bottom: number }
    width: number
    height: number
  } {
    return {
      center: { x: 0, y: 0 },
      bounds: { left: 0, top: 0, right: 0, bottom: 0 },
      width: 0,
      height: 0,
    }
  }

  /**
   * Determine if this pcb primitive should be flipped because the primitive
   * container is flipped
   *
   * TODO use footprint.originalLayer instead of assuming everything is defined
   * relative to the top layer
   */
  _getPcbPrimitiveFlippedHelpers(): {
    isFlipped: boolean
    maybeFlipLayer: (layer: LayerRef) => LayerRef
  } {
    const container = this.getPrimitiveContainer()
    const isFlipped = !container
      ? false
      : container._parsedProps.layer === "bottom"
    const maybeFlipLayer = (layer: LayerRef) => {
      if (isFlipped) {
        return layer === "top" ? "bottom" : "top"
      }
      return layer
    }
    return { isFlipped, maybeFlipLayer }
  }

  /**
   * Set the position of this component from the layout solver. This method
   * should operate using CircuitJson associated with this component, like
   * _getPcbCircuitJsonBounds it can be called multiple times as different
   * parents apply layout to their children.
   */
  _setPositionFromLayout(newCenter: { x: number; y: number }) {
    throw new Error(
      `_setPositionFromLayout not implemented for ${this.componentName}`,
    )
  }

  /**
   * Computes a transformation matrix from the props of this component for
   * schematic components
   */
  computeSchematicPropsTransform(): Matrix {
    const { _parsedProps: props } = this
    return compose(translate(props.schX ?? 0, props.schY ?? 0))
  }

  /**
   * Compute a transformation matrix combining all parent transforms for this
   * component
   */
  computeSchematicGlobalTransform(): Matrix {
    const manualPlacementTransform =
      this._getSchematicGlobalManualPlacementTransform(this)
    if (manualPlacementTransform) return manualPlacementTransform

    return compose(
      this.parent?.computeSchematicGlobalTransform?.() ?? identity(),
      this.computeSchematicPropsTransform(),
    )
  }

  _getSchematicSymbolName(): keyof typeof symbols | undefined {
    const { _parsedProps: props } = this
    const base_symbol_name = this.config
      .schematicSymbolName as keyof typeof symbols

    // derive rotation from schOrientation if provided
    const orientationRotationMap: Record<string, number> = {
      horizontal: 0,
      pos_left: 0,
      neg_right: 0,
      pos_right: 180,
      neg_left: 180,
      pos_top: 270,
      neg_bottom: 90,
      vertical: 270,
      pos_bottom: 90,
      neg_top: 90,
    }

    let normalizedRotation =
      props.schOrientation !== undefined
        ? orientationRotationMap[props.schOrientation]
        : props.schRotation

    if (normalizedRotation === undefined) {
      normalizedRotation = 0
    }
    // Normalize rotation to be between 0 and 360
    normalizedRotation = normalizedRotation % 360
    if (normalizedRotation < 0) {
      normalizedRotation += 360
    }

    // Validate that rotation is a multiple of 90 degrees
    if (props.schRotation !== undefined && normalizedRotation % 90 !== 0) {
      throw new Error(
        `Schematic rotation ${props.schRotation} is not supported for ${this.componentName}`,
      )
    }

    const symbol_name_horz = `${base_symbol_name}_horz` as keyof typeof symbols
    const symbol_name_vert = `${base_symbol_name}_vert` as keyof typeof symbols
    const symbol_name_up = `${base_symbol_name}_up` as keyof typeof symbols
    const symbol_name_down = `${base_symbol_name}_down` as keyof typeof symbols
    const symbol_name_left = `${base_symbol_name}_left` as keyof typeof symbols
    const symbol_name_right =
      `${base_symbol_name}_right` as keyof typeof symbols

    if (symbol_name_right in symbols && normalizedRotation === 0) {
      return symbol_name_right
    }
    if (symbol_name_up in symbols && normalizedRotation === 90) {
      return symbol_name_up
    }

    if (symbol_name_left in symbols && normalizedRotation === 180) {
      return symbol_name_left
    }

    if (symbol_name_down in symbols && normalizedRotation === 270) {
      return symbol_name_down
    }

    if (symbol_name_horz in symbols) {
      if (normalizedRotation === 0) return symbol_name_horz
      if (normalizedRotation === 180) return symbol_name_horz
    }
    if (symbol_name_vert in symbols) {
      if (normalizedRotation === 90) return symbol_name_vert
      if (normalizedRotation === 270) return symbol_name_vert
    }
    if (base_symbol_name in symbols) return base_symbol_name

    return undefined
  }

  _getSchematicSymbolNameOrThrow(): keyof typeof symbols {
    const symbol_name = this._getSchematicSymbolName()
    if (!symbol_name) {
      throw new Error(
        `No schematic symbol found (given: "${this.config.schematicSymbolName}")`,
      )
    }
    return symbol_name
  }

  getSchematicSymbol(): SchSymbol | null {
    const symbol_name = this._getSchematicSymbolName()
    if (!symbol_name) return null
    return symbols[symbol_name as keyof typeof symbols] ?? null
  }

  /**
   * Subcircuit groups have a prop called "layout" that can include manual
   * placements for pcb components. These are typically added from an IDE
   */
  _getPcbManualPlacementForComponent(
    component: PrimitiveComponent,
  ): { x: number; y: number } | null {
    if (!this.isSubcircuit) return null

    const manualEdits = this.props.manualEdits

    if (!manualEdits) return null

    const placementConfigPositions = manualEdits?.pcb_placements

    if (!placementConfigPositions) return null

    for (const position of placementConfigPositions) {
      if (
        isMatchingSelector(component, position.selector) ||
        component.props.name === position.selector
      ) {
        const center = applyToPoint(
          this._computePcbGlobalTransformBeforeLayout(),
          position.center as { x: number; y: number },
        )
        return center
      }
    }

    return null
  }

  _getSchematicManualPlacementForComponent(
    component: PrimitiveComponent,
  ): { x: number; y: number } | null {
    if (!this.isSubcircuit) return null

    const manualEdits = this.props.manualEdits

    if (!manualEdits) return null

    const placementConfigPositions = manualEdits.schematic_placements

    if (!placementConfigPositions) return null

    for (const position of placementConfigPositions) {
      if (
        isMatchingSelector(component, position.selector) ||
        component.props.name === position.selector
      ) {
        const center = applyToPoint(
          this.computeSchematicGlobalTransform(),
          position.center as { x: number; y: number },
        )
        return center
      }
    }

    return null
  }

  _getSchematicGlobalManualPlacementTransform(
    component: PrimitiveComponent,
  ): Matrix | null {
    const manualEdits = this.getSubcircuit()?._parsedProps.manualEdits
    if (!manualEdits) return null

    for (const position of manualEdits.schematic_placements ?? []) {
      if (
        isMatchingSelector(component, position.selector) ||
        component.props.name === position.selector
      ) {
        if (position.relative_to === "group_center") {
          return compose(
            this.parent?._computePcbGlobalTransformBeforeLayout() ?? identity(),
            translate(position.center.x, position.center.y),
          )
        }
      }
    }

    return null
  }

  _getGlobalPcbPositionBeforeLayout(): { x: number; y: number } {
    return applyToPoint(this._computePcbGlobalTransformBeforeLayout(), {
      x: 0,
      y: 0,
    })
  }

  _getGlobalSchematicPositionBeforeLayout(): { x: number; y: number } {
    return applyToPoint(this.computeSchematicGlobalTransform(), { x: 0, y: 0 })
  }

  _getBoard(): (PrimitiveComponent & BoardI) | undefined {
    let current: PrimitiveComponent | Renderable | null = this
    while (current) {
      const maybePrimitive = current as PrimitiveComponent
      if ((maybePrimitive as any).componentName === "Board") {
        return maybePrimitive as PrimitiveComponent & BoardI
      }
      current =
        (current.parent as PrimitiveComponent | Renderable | null) ?? null
    }
    return this.root?._getBoard() as (PrimitiveComponent & BoardI) | undefined
  }

  get root(): RootCircuit | null {
    return this.parent?.root ?? null
  }

  onAddToParent(parent: PrimitiveComponent) {
    this.parent = parent
  }

  /**
   * Called whenever the props change
   */
  onPropsChange(params: {
    oldProps: z.infer<ZodProps>
    newProps: z.infer<ZodProps>
    changedProps: string[]
  }) {}

  onChildChanged(child: PrimitiveComponent) {
    this.parent?.onChildChanged?.(child)
  }

  add(component: PrimitiveComponent) {
    // The react reconciler will try to add text nodes as children, but
    // we don't have a text component, so we just ignore them. The text is
    // passed as a prop to the parent component anyway.
    const textContent = (component as any).__text
    if (typeof textContent === "string") {
      // Components that support text children already receive the text via
      // their props. Simply ignore the generated text node.
      if (this.canHaveTextChildren || textContent.trim() === "") {
        return
      }
      // Otherwise this is likely accidental text in the JSX tree.
      throw new Error(
        `Invalid JSX Element: Expected a React component but received text "${textContent}"`,
      )
    }
    if (Object.keys(component).length === 0) {
      // Ignore empty objects produced by the reconciler in edge cases
      return
    }

    if (component.lowercaseComponentName === "panel") {
      throw new Error("<panel> must be a root-level element")
    }
    if (!component.onAddToParent) {
      throw new Error(
        `Invalid JSX Element: Expected a React component but received "${JSON.stringify(
          component,
        )}"`,
      )
    }
    component.onAddToParent(this)
    component.parent = this
    this.children.push(component)
  }

  addAll(components: PrimitiveComponent[]) {
    for (const component of components) {
      this.add(component)
    }
  }

  remove(component: PrimitiveComponent) {
    this.children = this.children.filter((c) => c !== component)
    this.childrenPendingRemoval.push(component)
    component.shouldBeRemoved = true
  }

  getSubcircuitSelector(): string {
    const name = this.name
    const endPart = name
      ? `${this.lowercaseComponentName}.${name}`
      : this.lowercaseComponentName

    if (!this.parent) return endPart
    if (this.parent.isSubcircuit) return endPart
    return `${this.parent.getSubcircuitSelector()} > ${endPart}`
  }

  getFullPathSelector(): string {
    const name = this.name
    const endPart = name
      ? `${this.lowercaseComponentName}.${name}`
      : this.lowercaseComponentName
    const parentSelector = this.parent?.getFullPathSelector?.()
    if (!parentSelector) return endPart
    return `${parentSelector} > ${endPart}`
  }

  getNameAndAliases(): string[] {
    return [this.name, ...(this._parsedProps.portHints ?? [])].filter(Boolean)
  }
  isMatchingNameOrAlias(name: string) {
    return this.getNameAndAliases().includes(name)
  }
  isMatchingAnyOf(aliases: Array<string | number>) {
    return this.getNameAndAliases().some((a) =>
      aliases.map((a) => a.toString()).includes(a),
    )
  }
  getPcbSize(): { width: number; height: number } {
    throw new Error(`getPcbSize not implemented for ${this.componentName}`)
  }

  doesSelectorMatch(selector: string): boolean {
    const myTypeNames = [this.componentName, this.lowercaseComponentName]
    const myClassNames = [this.name].filter(Boolean)

    const parts = selector.trim().split(/\> /)[0]
    const firstPart = parts[0]

    if (parts.length > 1) return false
    if (selector === "*") return true
    if (selector[0] === "#" && selector.slice(1) === this.props.id) return true
    if (selector[0] === "." && myClassNames.includes(selector.slice(1)))
      return true
    if (/^[a-zA-Z0-9_]/.test(firstPart) && myTypeNames.includes(firstPart))
      return true

    return false
  }

  getSubcircuit(): ISubcircuit {
    if (this.isSubcircuit) return this as unknown as ISubcircuit
    const group = this.parent?.getSubcircuit?.()
    if (!group)
      throw new Error("Component is not inside an opaque group (no board?)")
    return group
  }

  getGroup(): IGroup | null {
    if (this.isGroup) return this as unknown as IGroup
    return this.parent?.getGroup?.() ?? null
  }

  doInitialAssignNameToUnnamedComponents() {
    if (!this._parsedProps.name) {
      this.fallbackUnassignedName =
        this.getSubcircuit().getNextAvailableName(this)
    }
  }

  doInitialOptimizeSelectorCache() {
    if (!this.isSubcircuit) return
    const ports = this.selectAll("port")

    for (const port of ports) {
      // For ports inside primitive containers (like Symbol), use getParentNormalComponent
      // to get the actual parent component for selector caching
      const parentComponent = port.getParentNormalComponent?.() ?? port.parent
      const parentAliases = parentComponent?.getNameAndAliases()
      const portAliases = port.getNameAndAliases()
      if (!parentAliases) continue
      for (const parentAlias of parentAliases) {
        for (const portAlias of portAliases) {
          const selectors = [
            `.${parentAlias} > .${portAlias}`,
            `.${parentAlias} .${portAlias}`,
          ]
          for (const selector of selectors) {
            const ar = this._cachedSelectAllQueries.get(selector)
            if (ar) {
              ar.push(port)
            } else {
              this._cachedSelectAllQueries.set(selector, [port])
            }
          }
        }
      }
    }
    for (const [selector, ports] of this._cachedSelectAllQueries.entries()) {
      if (ports.length === 1) {
        this._cachedSelectOneQueries.set(selector, ports[0])
      }
    }
  }

  _cachedSelectAllQueries: Map<string, PrimitiveComponent[]> = new Map()
  selectAll<T extends PrimitiveComponent = PrimitiveComponent>(
    selectorRaw: string,
  ): T[] {
    if (this._cachedSelectAllQueries.has(selectorRaw)) {
      return this._cachedSelectAllQueries.get(selectorRaw) as T[]
    }
    const selector = preprocessSelector(selectorRaw, this)
    const result = selectAll(
      selector,
      this,
      cssSelectOptionsInsideSubcircuit,
    ) as T[]
    if (result.length > 0) {
      this._cachedSelectAllQueries.set(selectorRaw, result)
      return result
    }

    // If we didn't find anything, check for a subcircuit query
    const [firstpart, ...rest] = selector.split(" ")
    const subcircuit = selectOne(firstpart, this, {
      adapter: cssSelectPrimitiveComponentAdapterOnlySubcircuits,
    }) as ISubcircuit | null
    if (!subcircuit) return []
    const result2 = subcircuit.selectAll(rest.join(" ")) as T[]
    this._cachedSelectAllQueries.set(selectorRaw, result2)
    return result2
  }

  _cachedSelectOneQueries: Map<string, PrimitiveComponent | null> = new Map()
  selectOne<T = PrimitiveComponent>(
    selectorRaw: string,
    options?: {
      type?: string
      port?: boolean
      pcbPrimitive?: boolean
      schematicPrimitive?: boolean
    },
  ): T | null {
    if (this._cachedSelectOneQueries.has(selectorRaw)) {
      return this._cachedSelectOneQueries.get(selectorRaw) as T | null
    }
    const selector = preprocessSelector(selectorRaw, this)
    if (options?.port) {
      options.type = "port"
    }
    let result: T | null = null
    if (options?.type) {
      const allMatching = selectAll(
        selector,
        this,
        cssSelectOptionsInsideSubcircuit,
      )
      result = allMatching.find(
        (n) => n.lowercaseComponentName === options.type,
      ) as T | null
    }

    result ??= selectOne(
      selector,
      this,
      cssSelectOptionsInsideSubcircuit,
    ) as T | null

    if (result) {
      this._cachedSelectOneQueries.set(selectorRaw, result as any)
      return result
    }

    // If we didn't find anything, check for a subcircuit query
    const [firstpart, ...rest] = selector.split(" ")
    const subcircuit = selectOne(firstpart, this, {
      adapter: cssSelectPrimitiveComponentAdapterOnlySubcircuits,
    }) as ISubcircuit | null

    if (!subcircuit) return null

    result = subcircuit.selectOne(rest.join(" "), options) as T | null
    this._cachedSelectOneQueries.set(selectorRaw, result as any)
    return result
  }

  getAvailablePcbLayers(): string[] {
    if (this.isPcbPrimitive) {
      const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
      if ("layer" in this._parsedProps || this.componentName === "SmtPad") {
        const layer = maybeFlipLayer(this._parsedProps.layer ?? "top")
        return [layer]
      }
      if ("layers" in this._parsedProps) {
        return this._parsedProps.layers
      }
      if (this.componentName === "PlatedHole") {
        return [...(this.root?._getBoard()?.allLayers ?? ["top", "bottom"])]
      }
      return []
    }
    return []
  }

  /**
   * Returns all descendants
   *
   * NOTE: This crosses subcircuit boundaries, you may want to use
   * getSelectableDescendants instead
   */
  getDescendants(): PrimitiveComponent[] {
    const descendants: PrimitiveComponent[] = []
    for (const child of this.children) {
      descendants.push(child)
      descendants.push(...child.getDescendants())
    }
    return descendants
  }

  /**
   * Returns all descendants that are accessible without crossing a subcircuit
   * boundary
   */
  getSelectableDescendants(): PrimitiveComponent[] {
    const descendants: PrimitiveComponent[] = []
    for (const child of this.children) {
      if (child.isSubcircuit) {
        descendants.push(child)
      } else {
        descendants.push(child)
        descendants.push(...child.getSelectableDescendants())
      }
    }
    return descendants
  }

  /**
   * Return the number of pins in this component, this is important for
   * NormalComponents
   */
  _getPinCount(): number {
    return 0
  }

  /**
   * If this component represents a SchematicBox (like a Chip), return the
   * dimensions of the box, which allows computing the position of ports etc.
   */
  _getSchematicBoxDimensions(): SchematicBoxDimensions | null {
    return null
  }

  _getSchematicBoxComponentDimensions(): SchematicBoxComponentDimensions | null {
    // Only valid if we don't have a schematic symbol
    if (this.getSchematicSymbol()) return null
    if (!this.config.shouldRenderAsSchematicBox) return null

    const { _parsedProps: props } = this

    const dimensions = {
      schWidth: props.schWidth,
      schHeight: props.schHeight,
    }

    return dimensions
  }

  // TODO we shouldn't need to override this, errors can be rendered and handled
  // by the Renderable class, however, the Renderable class currently doesn't
  // have access to the database or cleanup
  renderError(message: Parameters<typeof Renderable.prototype.renderError>[0]) {
    if (typeof message === "string") {
      return super.renderError(message)
    }
    // TODO this needs to be cleaned up at some point!
    switch (message.type) {
      case "pcb_placement_error":
        this.root?.db.pcb_placement_error.insert(message as any)
        break
      case "pcb_via_clearance_error":
        this.root?.db.pcb_via_clearance_error.insert(message as any)
        break
      case "pcb_trace_error":
        this.root?.db.pcb_trace_error.insert(message as any)
        break
      case "pcb_manual_edit_conflict_warning":
        this.root?.db.pcb_manual_edit_conflict_warning.insert(message as any)
        break
      default:
        this.root?.db.pcb_placement_error.insert(message as any) // fallback
    }
  }

  getString(): string {
    const { lowercaseComponentName: cname, _parsedProps: props, parent } = this
    if (props?.pinNumber !== undefined && parent?.props?.name && props?.name) {
      return `<${cname}#${this._renderId}(pin:${props.pinNumber} .${parent?.props.name}>.${props.name}) />`
    }
    if (parent?.props?.name && props?.name) {
      return `<${cname}#${this._renderId}(.${parent?.props.name}>.${props?.name}) />`
    }
    if (props?.from && props?.to) {
      return `<${cname}#${this._renderId}(from:${props.from} to:${props?.to}) />`
    }
    if (props?.name) {
      return `<${cname}#${this._renderId} name=".${props?.name}" />`
    }
    if (props?.portHints) {
      return `<${cname}#${this._renderId}(${props.portHints.map((ph: string) => `.${ph}`).join(", ")}) />`
    }
    return `<${cname}#${this._renderId} />`
  }
  get [Symbol.toStringTag](): string {
    return this.getString()
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.getString()
  }
}
