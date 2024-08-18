import type { AnySoupElement } from "@tscircuit/soup"
import type { Project } from "../Project"
import type { AnyZodObject } from "zod"
import { z } from "zod"
import { symbols, type SchSymbol } from "schematic-symbols"
import { isValidElement as isReactElement } from "react"
import type { Footprint } from "./Footprint"
import { fp } from "footprinter"
import { createComponentsFromSoup } from "../utils/createComponentsFromSoup"

type SymbolName = keyof typeof symbols extends `${infer T}_${infer U}`
  ? T
  : never

export class BaseComponent<ZodProps extends AnyZodObject = any> {
  parent: BaseComponent | null = null
  children: BaseComponent[]
  childrenPendingRemoval: BaseComponent[]

  propsZod: AnyZodObject = z.object({}).passthrough()
  project: Project | null = null
  props: z.infer<ZodProps>

  schematicSymbolName: SymbolName | null = null

  canHaveChildren = false
  isStale = true

  isSourceRendered = false
  isSchematicRendered = false
  isPcbComponentRendered = false
  isPcbTraceRendered = false
  isCadRendered = false

  componentName = ""

  source_group_id: string | null = null
  source_component_id: string | null = null
  schematic_component_id: string | null = null
  pcb_component_id: string | null = null
  cad_component_id: string | null = null

  constructor(props: z.input<ZodProps>) {
    this.children = []
    this.childrenPendingRemoval = []
    this.props = this.propsZod.parse(props) as z.infer<ZodProps>
    this.setProps(props)
    if (!this.componentName) {
      this.componentName = this.constructor.name
    }
    this.afterCreate()
  }

  setProject(project: Project) {
    this.project = project
    for (const c of this.children) {
      c.setProject(project)
    }
  }

  setProps(props: Partial<z.input<ZodProps>>) {
    const newProps = this.propsZod.parse({
      ...this.props,
      ...props,
    }) as z.infer<ZodProps>
    const oldProps = this.props
    this.isStale = true
    this.props = newProps
    this.onPropsChange({
      oldProps,
      newProps,
      changedProps: Object.keys(props),
    })
    this.parent?.onChildChanged(this)
  }

  afterCreate() {}

  onAddToParent(parent: BaseComponent) {
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

  /**
   * Renders all children source elements.
   */
  doChildrenSourceRender() {
    for (const child of this.childrenPendingRemoval) {
      if (child.isSourceRendered) {
        child.removeSourceRender()
        child.isSourceRendered = false
      }
    }
    for (const child of this.children) {
      if (!child.isSourceRendered) {
        child.doInitialSourceRender()
        child.isSourceRendered = true
      } else {
        child.updateSourceRender()
      }
    }
  }

  /**
   * Renders all children schematic elements.
   */
  doChildrenSchematicRender() {
    for (const child of this.childrenPendingRemoval) {
      if (child.isSchematicRendered) {
        child.removeSchematicRender()
        child.isSchematicRendered = false
      }
    }
    for (const child of this.children) {
      if (!child.isSchematicRendered) {
        child.doInitialSchematicRender()
        child.isSchematicRendered = true
      } else {
        child.updateSchematicRender()
      }
    }
  }

  doChildrenPcbComponentRender() {
    for (const child of this.childrenPendingRemoval) {
      if (child.isPcbComponentRendered) {
        child.removePcbComponentRender()
        child.isPcbComponentRendered = false
      }
    }
    for (const child of this.children) {
      if (!child.isPcbComponentRendered) {
        child.doInitialPcbComponentRender()
        child.isPcbComponentRendered = true
      } else {
        child.updatePcbComponentRender()
      }
    }
  }

  doChildrenPcbTraceRender() {
    for (const child of this.childrenPendingRemoval) {
      if (child.isPcbTraceRendered) {
        child.removePcbTraceRender()
        child.isPcbTraceRendered = false
      }
    }
    for (const child of this.children) {
      if (!child.isPcbTraceRendered) {
        child.doInitialPcbTraceRender()
        child.isPcbTraceRendered = true
      } else {
        child.updatePcbTraceRender()
      }
    }
  }

  doInitialSourceRender() {
    this.doChildrenSourceRender()
  }

  doInitialSchematicRender() {
    const { db } = this.project!
    if (this.schematicSymbolName) {
      // TODO switch between horizontal and vertical based on schRotation
      const symbol_name = `${this.schematicSymbolName}_horz`

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
    this.doChildrenSchematicRender()
  }

  doInitialPcbComponentRender() {
    const { footprint } = this.props
    if (footprint) {
      if (typeof footprint === "string") {
        const fpSoup = fp.string(footprint).soup()
        // TODO save some kind of state to prevent re-creating the same components
        // and knowing when the string has changed
        const fpComponents = createComponentsFromSoup(fpSoup)
        this.children.push(...fpComponents)
      } else if (footprint.componentName === "Footprint") {
        const fp = footprint as Footprint
        if (!this.children.includes(fp)) {
          this.children.push(fp)
        }
      } else if (isReactElement(footprint)) {
        // TODO, maybe call .add() with the footprint?
      }
    }
    this.doChildrenPcbComponentRender()
  }

  doInitialPcbTraceRender() {
    this.doChildrenPcbTraceRender()
  }

  doInitialCadRender() {
    if (this.props.cadModel) {
      // TODO
    }
  }

  updateSourceRender() {
    this.doChildrenSourceRender()
  }

  /**
   * Called whenever a component is stale and needs to be rendered
   */
  updateSchematicRender() {
    this.doChildrenSchematicRender()
  }

  updatePcbComponentRender() {
    this.doChildrenPcbComponentRender()
  }

  updatePcbTraceRender() {
    this.doChildrenPcbTraceRender()
  }

  removeSourceRender() {
    this.doChildrenSourceRender()
  }

  removeSchematicRender() {
    this.doChildrenSchematicRender()
  }

  removePcbComponentRender() {
    this.doChildrenPcbComponentRender()
  }

  removePcbTraceRender() {
    this.doChildrenPcbTraceRender()
  }

  onChildChanged(child: BaseComponent) {
    this.isStale = true
    this.parent?.onChildChanged(child)
  }

  add(component: BaseComponent) {
    if (!this.canHaveChildren) {
      throw new Error(`${this.componentName} cannot have children`)
    }
    component.onAddToParent(this)
    this.children.push(component)
    this.isStale = true
  }

  remove(component: BaseComponent) {
    this.children = this.children.filter((c) => c !== component)
    this.childrenPendingRemoval.push(component)
    this.isStale = true
  }

  doesSelectorMatch(selector: string): boolean {
    const myTypeNames = [this.componentName, this.componentName.toLowerCase()]
    const myClassNames = [this.props.name].filter(Boolean)

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

  selectAll(selector: string): BaseComponent[] {
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

  selectOne(selector: string): BaseComponent | null {
    return this.selectAll(selector)[0] ?? null
  }

  getDescendants(): BaseComponent[] {
    const descendants: BaseComponent[] = []
    for (const child of this.children) {
      descendants.push(child)
      descendants.push(...child.getDescendants())
    }
    return descendants
  }
}
