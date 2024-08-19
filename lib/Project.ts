import type { AnySoupElement } from "@tscircuit/soup"
import type { BaseComponent } from "./components/BaseComponent"
import type { SoupUtilObjects } from "@tscircuit/soup-util"
import { su } from "@tscircuit/soup-util"

export class Project {
  rootComponent: BaseComponent | null = null
  children: BaseComponent[]
  db: SoupUtilObjects

  constructor() {
    this.children = []
    this.db = su([])
  }

  add(component: BaseComponent) {
    this.children.push(component)
  }

  _guessRootComponent() {
    if (this.rootComponent) return
    if (this.children.length === 1) {
      this.rootComponent = this.children[0]
      return
    }
    if (this.children.length === 0) {
      throw new Error(
        "Not able to guess root component: Project has no children (use project.add(...))",
      )
    }

    if (this.children.length > 0) {
      const board =
        this.children.find((c) => c.componentName === "Board") ?? null

      if (board) {
        this.rootComponent = board
        return
      }
    }
    throw new Error(
      "Not able to guess root component: Project has multiple children and no board",
    )
  }

  render() {
    if (!this.rootComponent) {
      this._guessRootComponent()
    }
    const { rootComponent, db } = this

    if (!rootComponent) throw new Error("Project has no root component")

    rootComponent.setProject(this)

    if (!rootComponent.isSourceRendered) {
      rootComponent.doPortMatching()
      rootComponent.doInitialSourceRender()
      rootComponent.doInitialSchematicComponentRender()
      rootComponent.doInitialPcbComponentRender()
      rootComponent.doInitialSchematicTraceRender()
      rootComponent.doInitialPcbTraceRender()
    } else {
      rootComponent.updateSourceRender()
      rootComponent.updateSchematicComponentRender()
      rootComponent.updatePcbComponentRender()
      rootComponent.updatePcbTraceRender()
      rootComponent.updateSchematicTraceRender()
    }
  }

  getSoup(): AnySoupElement[] {
    return this.db.toArray()
  }
}
