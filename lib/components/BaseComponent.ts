import type { AnySoupElement } from "@tscircuit/soup"
import type { Project } from "../Project"
import type { AnyZodObject } from "zod"
import { z } from "zod"

export class BaseComponent<ZodProps extends AnyZodObject = any> {
  parent: BaseComponent | null = null
  children: BaseComponent[]
  childrenPendingRemoval: BaseComponent[]

  propsZod: AnyZodObject = z.object({}).passthrough()
  project: Project | null = null
  props: z.infer<ZodProps>

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
    this.doChildrenSchematicRender()
  }

  doInitialPcbComponentRender() {
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
