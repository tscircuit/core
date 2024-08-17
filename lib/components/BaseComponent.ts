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

  componentName = ""

  source_group_id: string | null = null
  source_component_id: string | null = null
  schematic_component_id: string | null = null
  pcb_component_id: string | null = null

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
}
