import type { AnyCircuitElement, LayerRef } from "circuit-json"
import type { PrimitiveComponent } from "./components/base-components/PrimitiveComponent"
import type { SoupUtilObjects } from "@tscircuit/soup-util"
import { su } from "@tscircuit/soup-util"
import { isValidElement, type ReactElement } from "react"
import { createInstanceFromReactElement } from "./fiber/create-instance-from-react-element"
import { identity, type Matrix } from "transformation-matrix"

type RootCircuitEventName = "asyncEffectComplete"

export class Circuit {
  firstChild: PrimitiveComponent | null = null
  children: PrimitiveComponent[]
  db: SoupUtilObjects
  root: Circuit | null = null
  isRoot = true

  _hasRenderedAtleastOnce = false

  constructor() {
    this.children = []
    this.db = su([])
    // TODO rename to rootCircuit
    this.root = this
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

  /**
   * Get the main board for this Circuit.
   */
  _getBoard(): PrimitiveComponent & {
    boardThickness: number
    allLayers: LayerRef[]
  } {
    return this.children.find(
      (c) => c.componentName === "Board",
    ) as PrimitiveComponent & {
      boardThickness: number
      allLayers: LayerRef[]
    }
  }

  _guessRootComponent() {
    if (this.firstChild) return
    if (this.children.length === 1) {
      this.firstChild = this.children[0]
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
        this.firstChild = board
        return
      }
    }
    throw new Error(
      "Not able to guess root component: Project has multiple children and no board",
    )
  }

  render() {
    if (!this.firstChild) {
      this._guessRootComponent()
    }
    const { firstChild, db } = this

    if (!firstChild) throw new Error("Project has no root component")
    firstChild.parent = this as any
    firstChild.runRenderCycle()
    this._hasRenderedAtleastOnce = true
  }

  async renderUntilSettled(): Promise<void> {
    this.render()

    while (this._hasIncompleteAsyncEffects()) {
      await new Promise((resolve) => setTimeout(resolve, 100)) // Small delay
      this.render()
    }
  }

  private _hasIncompleteAsyncEffects(): boolean {
    return this.children.some((child) => {
      if (child._hasIncompleteAsyncEffects()) return true
      return child.children.some((grandchild) =>
        grandchild._hasIncompleteAsyncEffects(),
      )
    })
  }

  getSoup(): AnyCircuitElement[] {
    if (!this._hasRenderedAtleastOnce) this.render()
    return this.db.toArray()
  }

  getCircuitJson(): AnyCircuitElement[] {
    return this.getSoup()
  }

  toJson(): AnyCircuitElement[] {
    return this.getSoup()
  }

  async getSvg(options: { view: "pcb"; layer?: string }): Promise<string> {
    const circuitToSvg = await import("circuit-to-svg").catch((e) => {
      throw new Error(
        `To use project.getSvg, you must install the "circuit-to-svg" package.\n\n"${e.message}"`,
      )
    })

    return circuitToSvg.convertCircuitJsonToPcbSvg(this.getCircuitJson())
  }

  async preview(
    previewNameOrOpts:
      | string
      | {
          previewName: string
          tscircuitApiKey?: string
        },
  ) {
    const previewOpts =
      typeof previewNameOrOpts === "object"
        ? previewNameOrOpts
        : { previewName: previewNameOrOpts }
    throw new Error("project.preview is not yet implemented")
  }

  computeSchematicGlobalTransform(): Matrix {
    return identity()
  }

  _computePcbGlobalTransformBeforeLayout(): Matrix {
    return identity()
  }

  selectAll(selector: string): PrimitiveComponent[] {
    return this.firstChild?.selectAll(selector) ?? []
  }

  selectOne(
    selector: string,
    opts?: { type?: "component" | "port" },
  ): PrimitiveComponent | null {
    return this.firstChild?.selectOne(selector, opts) ?? null
  }

  _eventListeners: Record<
    RootCircuitEventName,
    Array<(...args: any[]) => void>
  > = { asyncEffectComplete: [] }

  emit(event: RootCircuitEventName, ...args: any[]) {
    if (!this._eventListeners[event]) return
    for (const listener of this._eventListeners[event]) {
      listener(...args)
    }
  }

  on(event: RootCircuitEventName, listener: (...args: any[]) => void) {
    if (!this._eventListeners[event]) {
      this._eventListeners[event] = []
    }
    this._eventListeners[event]!.push(listener)
  }
}

/**
 * @deprecated
 */
export const Project = Circuit
