import type { AnySoupElement } from "@tscircuit/soup"
import type { Project } from "../Project"

export class BaseComponent<Props = any> {
  parent: BaseComponent | null = null
  children: BaseComponent[]

  project: Project | null = null

  canHaveChildren = false
  stale = true

  componentName = ""

  source_group_id: string | null = null
  source_component_id: string | null = null
  schematic_component_id: string | null = null
  pcb_component_id: string | null = null

  constructor(public props: Props) {
    this.children = []
    this.props = props
    if (!this.componentName) {
      this.componentName = this.constructor.name
    }
    this.afterCreate()
  }

  setProps(props: Partial<Props>) {
    const newProps = { ...this.props, ...props }
    const oldProps = this.props
    this.stale = true
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
    oldProps: Props
    newProps: Props
    changedProps: string[]
  }) {}

  doInitialSourceRender() {
    for (const child of this.children) {
      child.updateSchematicRender()
    }
  }

  doInitialSchematicRender() {
    for (const child of this.children) {
      child.updateSchematicRender()
    }
  }

  doInitialPcbComponentRender() {
    for (const child of this.children) {
      child.updateSchematicRender()
    }
  }

  doInitialPcbTraceRender() {
    for (const child of this.children) {
      child.updateSchematicRender()
    }
  }

  updateSourceRender() {
    for (const child of this.children) {
      child.updateSchematicRender()
    }
  }

  /**
   * Called whenever a component is stale and needs to be rendered
   */
  updateSchematicRender() {
    for (const child of this.children) {
      child.updateSchematicRender()
    }
  }

  updatePcbComponentRender() {
    for (const child of this.children) {
      child.updatePcbComponentRender()
    }
  }

  updatePcbTraceRender() {
    for (const child of this.children) {
      child.updatePcbTraceRender()
    }
  }

  removeSourceRender() {
    for (const child of this.children) {
      child.removeSourceRender()
    }
  }

  removeSchematicRender() {
    for (const child of this.children) {
      child.updatePcbTraceRender()
    }
  }

  removePcbComponentRender() {
    for (const child of this.children) {
      child.removePcbComponentRender()
    }
  }

  removePcbTraceRender() {
    for (const child of this.children) {
      child.removePcbTraceRender()
    }
  }

  onChildChanged(child: BaseComponent) {
    this.stale = true
    this.parent?.onChildChanged(child)
  }

  add(component: BaseComponent) {
    if (!this.canHaveChildren) {
      throw new Error(`${this.componentName} cannot have children`)
    }
    component.onAddToParent(this)
    this.children.push(component)
    this.stale = true
  }
}
