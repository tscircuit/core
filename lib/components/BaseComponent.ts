import type { AnySoupElement } from "@tscircuit/soup"
import type { Project } from "../Project"

export class BaseComponent<Props = any> {
  parent: BaseComponent | null = null
  children: BaseComponent[]

  project: Project | null = null

  canHaveChildren = false
  stale = true

  componentName = ""

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
  }

  afterCreate() {}

  /**
   * Called when it's time to add this component to the soup
   */
  doMount() {}

  onAddToParent(parent: BaseComponent) {
    this.parent = parent
    this.project = parent.project
  }

  /**
   * Called when it's time to remove this component from the soup
   */
  doUnmount() {}

  onPropsChange(params: {
    oldProps: Props
    newProps: Props
    changedProps: string[]
  }) {}

  preSchematicRender() {}
  doSchematicRender() {}
  postSchematicRender() {}

  prePcbComponentRender() {}
  doPcbComponentRender() {}
  postPcbComponentRender() {}

  prePcbTraceRender() {}
  doPcbTraceRender() {}
  postPcbTraceRender() {}

  add(component: BaseComponent) {
    if (!this.canHaveChildren) {
      throw new Error(`${this.componentName} cannot have children`)
    }
    component.onAddToParent(this)
    this.children.push(component)
    this.stale = true
  }

  render() {
    if (!this.stale) return
    if (!this.parent)
      throw new Error(
        `${this.componentName} parent not set, but was asked to render`,
      )
    this.project = this.parent.project

    for (const child of this.children) {
      child.render()
    }

    this.stale = false
  }
}
