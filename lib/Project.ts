import type { AnySoupElement } from "@tscircuit/soup"
import type { PrimitiveComponent } from "./components/base-components/PrimitiveComponent"
import type { SoupUtilObjects } from "@tscircuit/soup-util"
import { su } from "@tscircuit/soup-util"
import { isValidElement, type ReactElement } from "react"
import { createInstanceFromReactElement } from "./fiber/create-instance-from-react-element"
import { identity, type Matrix } from "transformation-matrix"

export class Project {
  rootComponent: PrimitiveComponent | null = null
  children: PrimitiveComponent[]
  db: SoupUtilObjects

  constructor() {
    this.children = []
    this.db = su([])
  }

  add(componentOrElm: PrimitiveComponent | ReactElement) {
    let component: PrimitiveComponent
    if (isValidElement(componentOrElm)) {
      // TODO store subtree
      component = createInstanceFromReactElement(componentOrElm)
    } else {
      component = componentOrElm as PrimitiveComponent
    }
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

    rootComponent.runRenderCycle()
  }

  getSoup(): AnySoupElement[] {
    return this.db.toArray()
  }

  getCircuitJson(): AnySoupElement[] {
    return this.getSoup()
  }

  computeGlobalSchematicTransform(): Matrix {
    return identity()
  }

  computeGlobalPcbTransform(): Matrix {
    return identity()
  }
}
