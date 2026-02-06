import { mountedboardProps } from "@tscircuit/props"
import type { ReactElement } from "react"
import { isValidElement as isReactElement } from "react"
import type { z } from "zod"
import { RootCircuit } from "../../RootCircuit"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { createInstanceFromReactElement } from "../../fiber/create-instance-from-react-element"
import { inflateCircuitJson } from "../../utils/circuit-json/inflate-circuit-json"
import { Group } from "../primitive-components/Group/Group"
import type { SubcircuitI } from "../primitive-components/Group/Subcircuit/SubcircuitI"

export class MountedBoard
  extends Group<typeof mountedboardProps>
  implements SubcircuitI
{
  private _mountedChildren: PrimitiveComponent[] = []

  constructor(props: z.input<typeof mountedboardProps>) {
    super({
      ...props,
      // @ts-ignore
      subcircuit: true,
    })
  }

  get config() {
    return {
      componentName: "MountedBoard",
      zodProps: mountedboardProps,
    }
  }

  add(componentOrElm: PrimitiveComponent | ReactElement) {
    let component: PrimitiveComponent
    if (isReactElement(componentOrElm)) {
      component = createInstanceFromReactElement(componentOrElm)
    } else {
      component = componentOrElm as PrimitiveComponent
    }

    const textContent = (component as any).__text
    if (typeof textContent === "string") {
      if (this.canHaveTextChildren || textContent.trim() === "") {
        return
      }
      throw new Error(
        `Invalid JSX Element: Expected a React component but received text "${textContent}"`,
      )
    }
    if (Object.keys(component).length === 0) {
      return
    }
    if (component.lowercaseComponentName === "panel") {
      throw new Error("<panel> must be a root-level element")
    }
    if (!component.onAddToParent) {
      throw new Error(
        `Invalid JSX Element: Expected a React component but received "${JSON.stringify(
          component,
        )}"`,
      )
    }

    this._mountedChildren.push(component)
  }

  doInitialInflateSubcircuitCircuitJson() {
    const { circuitJson } = this._parsedProps

    if (circuitJson && this._mountedChildren.length > 0) {
      throw new Error("Component cannot have both circuitJson and children")
    }

    let mountedCircuitJson = circuitJson

    if (!mountedCircuitJson && this._mountedChildren.length > 0) {
      const mountedCircuit = new RootCircuit({
        platform: this.root?.platform,
        projectUrl: this.root?.projectUrl,
      })
      for (const child of this._mountedChildren) {
        mountedCircuit.add(child)
      }
      mountedCircuit.render()
      mountedCircuitJson = mountedCircuit.getCircuitJson()
    }

    if (mountedCircuitJson) {
      this._isInflatedFromCircuitJson = true
      inflateCircuitJson(this, mountedCircuitJson, [])
    }
  }
}
