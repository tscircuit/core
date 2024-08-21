import type { AnySoupElement, AnySourceComponent } from "@tscircuit/soup"
import type { Project } from "../../Project"
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
  translate,
  type Matrix,
} from "transformation-matrix"

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

  project: Project | null = null
  props: z.input<ZodProps>
  _parsedProps: z.infer<ZodProps>

  componentName = ""

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
    this._parsedProps = this.config.zodProps.parse(
      props ?? {},
    ) as z.infer<ZodProps>
    if (!this.componentName) {
      this.componentName = this.constructor.name
    }
  }

  setProject(project: Project) {
    this.project = project
    for (const c of this.children) {
      c.setProject(project)
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
    // TODO rotations
    return compose(translate(this.props.pcbX, this.props.pcbY))
  }

  /**
   * Compute a transformation matrix combining all parent transforms for PCB
   * components
   */
  computePcbGlobalTransform(): Matrix {
    return compose(
      this.parent?.computePcbGlobalTransform() ?? identity(),
      this.computePcbPropsTransform(),
    )
  }

  /**
   * Computes a transformation matrix from the props of this component for
   * schematic components
   */
  computeSchematicPropsTransform(): Matrix {
    return compose(translate(this.props.schX, this.props.schY))
  }

  /**
   * Compute a transformation matrix combining all parent transforms for this
   * component
   */
  computeSchematicGlobalTransform(): Matrix {
    return compose(
      this.parent?.computeSchematicGlobalTransform() ?? identity(),
      this.computeSchematicPropsTransform(),
    )
  }

  getGlobalPcbPosition(): { x: number; y: number } {
    return applyToPoint(this.computePcbGlobalTransform(), { x: 0, y: 0 })
  }

  getGlobalSchematicPosition(): { x: number; y: number } {
    return applyToPoint(this.computeSchematicGlobalTransform(), { x: 0, y: 0 })
  }

  onAddToParent(parent: PrimitiveComponent) {
    this.parent = parent
    this.project = parent.project
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

  doesSelectorMatch(selector: string): boolean {
    const myTypeNames = [this.componentName, this.componentName.toLowerCase()]
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

  selectAll(selector: string): PrimitiveComponent[] {
    const parts = selector.split(/\> /)[0]
    const firstPart = parts[0]
    const otherParts = selector.replace(firstPart, "")
    const myTypeNames = [this.componentName, this.componentName.toLowerCase()]
    const myClassNames = [this.props.name].filter(Boolean)

    if (selector === "*") {
      return this.getDescendants()
    }
    if (firstPart.startsWith("#") && parts.length === 1) {
      const id = firstPart.slice(1)
      return this.getDescendants().filter((c) => c.props.id === id)
    }

    // e.g. group > .AnotherGroup > led.anode
    if (firstPart.startsWith(".") || /^[a-zA-Z0-9_]/.test(firstPart)) {
      const isMatchingMe = this.doesSelectorMatch(firstPart)
      if (isMatchingMe && parts.length === 1) {
        // TODO: technically, descendants could contain sub-classes with the
        // same name, but that edge case seems like bad practice anyway...
        return [this]
      }
      if (isMatchingMe) {
        return this.children.flatMap((c) => c.selectAll(otherParts))
      }

      if (otherParts.trim().startsWith(">")) {
        const childrenSelector = otherParts.trim().slice(1)
        const childrenSelectorFirstPart = childrenSelector.split(/\> /)[0]
        return this.children
          .filter((c) => c.doesSelectorMatch(childrenSelectorFirstPart))
          .flatMap((c) => c.selectAll(childrenSelector))
      }
      return this.children.flatMap((c) => c.selectAll(otherParts))
    }

    throw new Error(`Could not handle selector "${selector}"`)
  }

  selectOne(selector: string): PrimitiveComponent | null {
    return this.selectAll(selector)[0] ?? null
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
    const { componentName, _parsedProps: props, parent } = this
    if (parent?.props?.name && props?.name) {
      return `[${componentName}#${this._renderId} ".${parent?.props.name} > .${props?.name}"]`
    }
    if (props?.name) {
      return `[${componentName}#${this._renderId} ".${props?.name}"]`
    }
    if (props?.portHints) {
      return `[${componentName}#${this._renderId} "${props.portHints.map((ph: string) => `.${ph}`).join(", ")}"]`
    }
    return `[${componentName}#${this._renderId}]`
  }
  get [Symbol.toStringTag](): string {
    return this.getString()
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.getString()
  }
}
