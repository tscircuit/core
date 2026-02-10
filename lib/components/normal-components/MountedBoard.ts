import { mountedboardProps } from "@tscircuit/props"
import { Group } from "../primitive-components/Group/Group"
import type { SubcircuitI } from "../primitive-components/Group/Subcircuit/SubcircuitI"
import { inflateCircuitJson } from "../../utils/circuit-json/inflate-circuit-json"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { RootCircuit } from "../../RootCircuit"
import type { z } from "zod"
import { isValidElement, type ReactElement } from "react"

export class MountedBoard
  extends Group<typeof mountedboardProps>
  implements SubcircuitI
{
  private _mountedChildren: PrimitiveComponent[] = []

  constructor(props: z.input<typeof mountedboardProps>) {
    super({
      ...props,
      // @ts-ignore - subcircuit is needed for Group behavior
      subcircuit: true,
    })
  }

  get config() {
    return {
      componentName: "MountedBoard",
      zodProps: mountedboardProps,
    }
  }

  /**
   * Override add() to store mounted children for later rendering
   */
  add(componentOrElm: PrimitiveComponent | ReactElement): this {
    if (isValidElement(componentOrElm)) {
      // Render the React element to get PrimitiveComponent instances
      const tmpCircuit = new RootCircuit()
      tmpCircuit.add(componentOrElm)
      tmpCircuit.render()
      const children = tmpCircuit.children

      for (const child of children) {
        if (child.lowercaseComponentName === "panel") {
          throw new Error("MountedBoard cannot contain a <panel> element")
        }
        this._mountedChildren.push(child as PrimitiveComponent)
      }
      return this
    }

    if (!(componentOrElm instanceof Object) || !("props" in componentOrElm)) {
      throw new Error(
        `Invalid component passed to MountedBoard.add(): ${typeof componentOrElm}`,
      )
    }

    this._mountedChildren.push(componentOrElm as PrimitiveComponent)
    return this
  }

  /**
   * During this phase, we inflate the subcircuit circuit json into class
   * instances
   */
  doInitialInflateSubcircuitCircuitJson() {
    const { circuitJson, children } = this._parsedProps

    // If circuitJson is provided, inflate it
    if (circuitJson) {
      if (children) {
        throw new Error(
          "MountedBoard cannot have both circuitJson and children",
        )
      }
      this._isInflatedFromCircuitJson = true
      inflateCircuitJson(this, circuitJson, children)
      return
    }

    // If we have mounted children from add() calls, add them to this group
    if (this._mountedChildren.length > 0) {
      for (const child of this._mountedChildren) {
        child.parent = this
        this.children.push(child)
      }
      return
    }

    // Otherwise, inflate from children (JSX children)
    inflateCircuitJson(this, circuitJson, children)
  }
}
