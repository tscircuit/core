import type { AnySoupElement, AnySourceComponent } from "@tscircuit/soup"
import type { Circuit } from "../../Project"
import type { ZodType } from "zod"
import { z } from "zod"
import { symbols, type SchSymbol, type BaseSymbolName } from "schematic-symbols"
import { isValidElement as isReactElement, type ReactElement } from "react"
import type { Port } from "../primitive-components/Port"
import { Renderable, type RenderPhase } from "./Renderable"
import {
  applyToPoint,
  compose,
  identity,
  rotate,
  translate,
  type Matrix,
} from "transformation-matrix"
import { isMatchingSelector } from "lib/utils/selector-matching"
import type { LayoutBuilder } from "@tscircuit/layout"

export interface BaseComponentConfig {
  schematicSymbolName?: BaseSymbolName | null
  zodProps: ZodType
  sourceFtype?: AnySourceComponent["ftype"] | null
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
      zodProps: z.object({}).passthrough(),
    }
  }

  props: z.input<ZodProps>
  _parsedProps: z.infer<ZodProps>

  componentName = ""
  lowercaseComponentName = ""

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
    this._parsedProps = this.config.zodProps.parse(
      props ?? {},
    ) as z.infer<ZodProps>
    if (!this.componentName) {
      this.componentName = this.constructor.name
      this.lowercaseComponentName = this.componentName.toLowerCase()
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
    this.parent?.onChildChanged(this)
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

    return compose(
      this.parent?._computePcbGlobalTransformBeforeLayout() ?? identity(),
      this.computePcbPropsTransform(),
    )
  }

  /**
   * Compute the bounds of this component the circuit json elements associated
   * with it.
   */
  _getCircuitJsonBounds(): {
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
   * Set the position of this component from the layout solver. This method
   * should operate using CircuitJson associated with this component, like
   * _getCircuitJsonBounds it can be called multiple times as different
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

  getSchematicSymbol(variant: "horz" | "vert" | null = null): SchSymbol | null {
    if (variant === null) {
      return this.getSchematicSymbol(
        this.props.schRotation % 90 === 0 ? "vert" : "horz",
      )
    }
    const { config } = this
    if (!config.schematicSymbolName) return null
    return (
      symbols[
        `${config.schematicSymbolName}_${variant}` as keyof typeof symbols
      ] ?? null
    )
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
    if (!layout) return null

    const placementConfig = layout.manual_pcb_placement_config
    if (!placementConfig) return null

    for (const position of placementConfig.positions) {
      if (isMatchingSelector(component, position.selector)) {
        const center = applyToPoint(
          this._computePcbGlobalTransformBeforeLayout(),
          position.center,
        )
        return center
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
    this.parent?.onChildChanged(child)
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

  getSubcircuit(): PrimitiveComponent {
    if (this.isSubcircuit) return this
    const group = this.parent?.getSubcircuit()
    if (!group)
      throw new Error("Component is not inside an opaque group (no board?)")
    return group
  }

  selectAll(selector: string): PrimitiveComponent[] {
    const parts = selector.trim().split(/\s+/)
    let results: PrimitiveComponent[] = [this]

    let onlyDirectChildren = false
    for (const part of parts) {
      if (part === ">") {
        onlyDirectChildren = true
      } else {
        results = results.flatMap((component) => {
          return (
            onlyDirectChildren ? component.children : component.getDescendants()
          ).filter((descendant) => isMatchingSelector(descendant, part))
        })
        onlyDirectChildren = false
      }
    }

    return results.filter((component) => component !== this)
  }

  selectOne(
    selector: string,
    options?: {
      type?: string
      port?: boolean
      pcbPrimitive?: boolean
      schematicPrimitive?: boolean
    },
  ): PrimitiveComponent | null {
    let type = options?.type?.toLowerCase()
    if (options?.port) type = "port"
    if (type) {
      return (
        this.selectAll(selector).find(
          (c) => c.lowercaseComponentName === type,
        ) ?? null
      )
    }
    if (options?.pcbPrimitive) {
      return this.selectAll(selector).find((c) => c.isPcbPrimitive) ?? null
    }
    if (options?.schematicPrimitive) {
      return (
        this.selectAll(selector).find((c) => c.isSchematicPrimitive) ?? null
      )
    }
    return this.selectAll(selector)[0] ?? null
  }

  getAvailablePcbLayers(): string[] {
    if (this.isPcbPrimitive) {
      if (this.props.layer) return [this.props.layer]
      if (this.componentName === "PlatedHole") {
        return ["top", "bottom"] // TODO derive layers from parent
      }
      return []
    }
    return []
  }

  getDescendants(): PrimitiveComponent[] {
    const descendants: PrimitiveComponent[] = []
    for (const child of this.children) {
      descendants.push(child)
      descendants.push(...child.getDescendants())
    }
    return descendants
  }

  getString(): string {
    const { lowercaseComponentName: cname, _parsedProps: props, parent } = this
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
