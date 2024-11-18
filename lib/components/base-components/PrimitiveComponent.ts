import type { LayoutBuilder } from "@tscircuit/layout"
import type { AnySourceComponent, LayerRef } from "circuit-json"
import { InvalidProps } from "lib/errors/InvalidProps"
import { isMatchingSelector } from "lib/utils/selector-matching"
import { type BaseSymbolName, type SchSymbol, symbols } from "schematic-symbols"
import {
  type Matrix,
  applyToPoint,
  compose,
  flipY,
  identity,
  rotate,
  translate,
} from "transformation-matrix"
import type { ZodType } from "zod"
import { z } from "zod"
import type { Circuit } from "../../Circuit"
import type { ISubcircuit } from "../primitive-components/Group/ISubcircuit"
import { Renderable } from "./Renderable"
import type { SchematicBoxDimensions } from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import Debug from "debug"

const debugSelectAll = Debug("tscircuit:primitive-component:selectAll")

export interface BaseComponentConfig {
  componentName: string
  schematicSymbolName?: string | null
  zodProps: ZodType
  sourceFtype?: AnySourceComponent["ftype"] | null
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
      // Implied opaque group for top-level group
      (this.lowercaseComponentName === "group" && (this?.parent as any)?.isRoot)
    )
  }

  get isGroup() {
    return this.lowercaseComponentName === "group"
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

  source_group_id: string | null = null
  source_component_id: string | null = null
  schematic_component_id: string | null = null
  pcb_component_id: string | null = null
  cad_component_id: string | null = null

  constructor(props: z.input<ZodProps>) {
    super(props)
    this.children = []
    this.childrenPendingRemoval = []
    this.props = props ?? {}
    this.externallyAddedAliases = []
    const parsePropsResult = this.config.zodProps.safeParse(props ?? {})
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

  /**
   * Computes a transformation matrix from the props of this component for PCB
   * components
   */
  computePcbPropsTransform(): Matrix {
    const { _parsedProps: props } = this

    const matrix = compose(
      translate(props.pcbX ?? 0, props.pcbY ?? 0),
      rotate(((props.pcbRotation ?? 0) * Math.PI) / 180),
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
    const { _parsedProps: props } = this
    const manualPlacement =
      this.getSubcircuit()._getManualPlacementForComponent(this)

    // pcbX or pcbY will override the manual placement
    if (
      manualPlacement &&
      this.props.pcbX === undefined &&
      this.props.pcbY === undefined
    ) {
      return compose(
        this.parent?._computePcbGlobalTransformBeforeLayout() ?? identity(),
        compose(
          translate(manualPlacement.x, manualPlacement.y),
          rotate(((props.pcbRotation ?? 0) * Math.PI) / 180),
        ),
      )
    }

    // If this is a primitive, and the parent primitive container is flipped,
    // we flip it's position
    if (this.isPcbPrimitive) {
      const primitiveContainer = this.getPrimitiveContainer()
      if (primitiveContainer) {
        const isFlipped = primitiveContainer._parsedProps.layer === "bottom"
        const containerCenter =
          primitiveContainer._getGlobalPcbPositionBeforeLayout()

        if (isFlipped) {
          const flipOperation = compose(
            translate(containerCenter.x, containerCenter.y),
            flipY(),
            translate(-containerCenter.x, -containerCenter.y),
          )
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
    return compose(translate(this.props.schX ?? 0, this.props.schY ?? 0))
  }

  /**
   * Compute a transformation matrix combining all parent transforms for this
   * component
   */
  computeSchematicGlobalTransform(): Matrix {
    return compose(
      this.parent?.computeSchematicGlobalTransform?.() ?? identity(),
      this.computeSchematicPropsTransform(),
    )
  }

  _getSchematicSymbolName(): keyof typeof symbols | undefined {
    const { _parsedProps: props } = this
    const base_symbol_name = this.config
      .schematicSymbolName as keyof typeof symbols

    const symbol_name_horz = `${base_symbol_name}_horz` as keyof typeof symbols
    const symbol_name_vert = `${base_symbol_name}_vert` as keyof typeof symbols
    const symbol_name_up = `${base_symbol_name}_up` as keyof typeof symbols
    const symbol_name_down = `${base_symbol_name}_down` as keyof typeof symbols
    const symbol_name_left = `${base_symbol_name}_left` as keyof typeof symbols
    const symbol_name_right =
      `${base_symbol_name}_right` as keyof typeof symbols

    if (
      symbol_name_right in symbols &&
      (props.schRotation === undefined || props.schRotation === 0)
    ) {
      return symbol_name_right
    }
    if (symbol_name_up in symbols && props.schRotation === 90) {
      return symbol_name_up
    }

    if (symbol_name_left in symbols && props.schRotation === 180) {
      return symbol_name_left
    }

    if (symbol_name_down in symbols && props.schRotation === 270) {
      return symbol_name_down
    }

    if (symbol_name_horz in symbols) {
      if (props.schRotation === 0 || props.schRotation === undefined)
        return symbol_name_horz
      if (props.schRotation === 180) return symbol_name_horz
    }
    if (symbol_name_vert in symbols) {
      if (props.schRotation === 90) return symbol_name_vert
      if (props.schRotation === 270) return symbol_name_vert
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
  _getManualPlacementForComponent(
    component: PrimitiveComponent,
  ): { x: number; y: number } | null {
    if (!this.isSubcircuit) return null

    const layout: LayoutBuilder = this.props.layout
    const manualEdits = this.props.manualEdits

    if (!layout && !manualEdits) return null

    const placementConfigPositions =
      layout?.manual_pcb_placement_config?.positions ||
      manualEdits?.pcb_placements

    if (!placementConfigPositions) return null

    for (const position of placementConfigPositions) {
      if (
        (layout && isMatchingSelector(component, position.selector)) ||
        component.props.name === position.selector
      ) {
        const center = applyToPoint(
          this._computePcbGlobalTransformBeforeLayout(),
          position.center,
        )
        return Array.isArray(center) ? { x: center[0], y: center[1] } : center
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

  get root(): Circuit | null {
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
    const name = this._parsedProps.name
    const endPart = name
      ? `${this.lowercaseComponentName}.${name}`
      : this.lowercaseComponentName

    if (!this.parent) return endPart
    if (this.parent.isSubcircuit) return endPart
    return `${this.parent.getSubcircuitSelector()} > ${endPart}`
  }

  getFullPathSelector(): string {
    const name = this._parsedProps.name
    const endPart = name
      ? `${this.lowercaseComponentName}.${name}`
      : this.lowercaseComponentName
    const parentSelector = this.parent?.getFullPathSelector?.()
    if (!parentSelector) return endPart
    return `${parentSelector} > ${endPart}`
  }

  getNameAndAliases(): string[] {
    return [
      this._parsedProps.name,
      ...(this._parsedProps.portHints ?? []),
    ].filter(Boolean)
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
    const myClassNames = [this._parsedProps.name].filter(Boolean)

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

  selectAll(selector: string): PrimitiveComponent[] {
    debugSelectAll(`selectAll: "${selector}"`)
    /**
     * Splits something like ".R1 > .R2" into [".R1", ">", ".R2"]
     */
    const parts = selector.trim().split(/\s+/)

    /**
     * Mutable array of results. As we iterate over the parts, we'll filter
     * or add items to this array. For example, if we go into a subcircuit,
     * we'll add all the components in that subcircuit to this array because
     * they're now accessible.
     *
     * this = <board />
     * parts: [".subcircuit1", ">", ".R1"]
     *
     * iteration 0:
     * part: ".subcircuit1"
     * currentSearch: [<subcircuit />]
     * currentResults: []
     * ...
     * currentSearch: [<resistor name="R1" />]
     * currentResults: [<subcircuit />]
     *
     * iteration 1:
     * part: ">"
     * onlyDirectChildren = true
     *
     * iteration 2:
     * part: ".R1"
     * currentSearch: [<resistor />]
     * currentResults: [<subcircuit />]
     * ...
     * currentSearch: []
     * currentResults: [<resistor />]
     */
    let currentSearch: PrimitiveComponent[] =
      parts[0] === ">" ? this.children : this.getSelectableDescendants()
    let currentResults: PrimitiveComponent[] = []

    let onlyDirectChildren = false
    let iteration = -1
    for (const part of parts) {
      iteration++
      debugSelectAll(`\n\niteration: ${iteration}`)
      debugSelectAll(`part: "${parts[iteration]}"`)
      debugSelectAll(
        `currentSearch: [${currentSearch.map((r) => r.getString()).join(",")}]`,
      )
      debugSelectAll(
        `currentResults: [${currentResults.map((r) => r.getString()).join(",")}]`,
      )

      if (part === ">") {
        onlyDirectChildren = true
      } else {
        const newResults = currentSearch.filter((component) =>
          isMatchingSelector(component, part),
        )
        const newSearch = newResults.flatMap((component) => {
          if (onlyDirectChildren) return component.children
          return component.getSelectableDescendants()
        })

        currentSearch = newSearch
        currentResults = newResults

        onlyDirectChildren = false
      }
    }

    return currentResults
  }

  selectOne<T = PrimitiveComponent>(
    selector: string,
    options?: {
      type?: string
      port?: boolean
      pcbPrimitive?: boolean
      schematicPrimitive?: boolean
    },
  ): T | null {
    let type = options?.type?.toLowerCase()
    if (options?.port) type = "port"
    if (type) {
      return (
        (this.selectAll(selector).find(
          (c) => c.lowercaseComponentName === type,
        ) as T) ?? null
      )
    }
    if (options?.pcbPrimitive) {
      return (
        (this.selectAll(selector).find((c) => c.isPcbPrimitive) as T) ?? null
      )
    }
    if (options?.schematicPrimitive) {
      return (
        (this.selectAll(selector).find((c) => c.isSchematicPrimitive) as T) ??
        null
      )
    }
    return (this.selectAll(selector)[0] as T) ?? null
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
        return this.root?._getBoard()?.allLayers ?? ["top", "bottom"]
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

  // TODO we shouldn't need to override this, errors can be rendered and handled
  // by the Renderable class, however, the Renderable class currently doesn't
  // have access to the database or cleanup
  renderError(message: Parameters<typeof Renderable.prototype.renderError>[0]) {
    if (typeof message === "string") {
      return super.renderError(message)
    }
    // TODO this needs to be cleaned up at some point!
    this.root?.db.pcb_placement_error.insert(message)
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
