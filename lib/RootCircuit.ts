import type { AnyCircuitElement, LayerRef } from "circuit-json"
import type { PrimitiveComponent } from "./components/base-components/PrimitiveComponent"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { su } from "@tscircuit/circuit-json-util"
import { isValidElement, type ReactElement } from "react"
import { createInstanceFromReactElement } from "./fiber/create-instance-from-react-element"
import { identity, type Matrix } from "transformation-matrix"
import type { RenderPhase } from "./components/base-components/Renderable"
import pkgJson from "../package.json"
import type { RootCircuitEventName } from "./events"
import type { PlatformConfig } from "@tscircuit/props"

export class RootCircuit {
  firstChild: PrimitiveComponent | null = null
  children: PrimitiveComponent[]
  db: CircuitJsonUtilObjects
  root: RootCircuit | null = null
  isRoot = true
  schematicDisabled = false
  pcbDisabled = false
  pcbRoutingDisabled = false

  /**
   * The RootCircuit name is usually set by the platform, it's not required but
   * if supplied can identify the circuit in certain effects, e.g. it is passed
   * as the display_name parameter for autorouting effects.
   */
  name?: string

  platform?: PlatformConfig

  _hasRenderedAtleastOnce = false

  constructor({ platform }: { platform?: PlatformConfig } = {}) {
    this.children = []
    this.db = su([])
    // TODO rename to rootCircuit
    this.root = this
    this.platform = platform
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
    _connectedSchematicPortPairs: Set<string>
    allLayers: LayerRef[]
  } {
    return this.children.find(
      (c) => c.componentName === "Board",
    ) as PrimitiveComponent & {
      boardThickness: number
      _connectedSchematicPortPairs: Set<string>
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
        "Not able to guess root component: RootCircuit has no children (use circuit.add(...))",
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
      "Not able to guess root component: RootCircuit has multiple children and no board",
    )
  }

  render() {
    if (!this.firstChild) {
      this._guessRootComponent()
    }
    const { firstChild, db } = this
    if (!firstChild) throw new Error("RootCircuit has no root component")
    firstChild.parent = this as any
    firstChild.runRenderCycle()
    this._hasRenderedAtleastOnce = true
  }

  async renderUntilSettled(): Promise<void> {
    if (!this.db.source_project_metadata.list()?.[0]) {
      this.db.source_project_metadata.insert({
        software_used_string: `@tscircuit/core@${this.getCoreVersion()}`,
      })
    }

    this.render()

    while (this._hasIncompleteAsyncEffects()) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      this.render()
    }

    this.emit("renderComplete")
  }

  private _hasIncompleteAsyncEffects(): boolean {
    return this.children.some((child) => {
      if (child._hasIncompleteAsyncEffects()) return true
      return child.children.some((grandchild) =>
        grandchild._hasIncompleteAsyncEffects(),
      )
    })
  }

  getCircuitJson(): AnyCircuitElement[] {
    if (!this._hasRenderedAtleastOnce) this.render()
    return this.db.toArray()
  }

  toJson(): AnyCircuitElement[] {
    return this.getCircuitJson()
  }

  async getSvg(options: { view: "pcb"; layer?: string }): Promise<string> {
    const circuitToSvg = await import("circuit-to-svg").catch((e) => {
      throw new Error(
        `To use circuit.getSvg, you must install the "circuit-to-svg" package.\n\n"${e.message}"`,
      )
    })

    return circuitToSvg.convertCircuitJsonToPcbSvg(this.getCircuitJson())
  }

  getCoreVersion(): string {
    const [major, minor, patch] = pkgJson.version.split(".").map(Number)
    // We add one to the patch version because the build increments the version
    // after the build (it's a hack- won't work for major releases)
    return `${major}.${minor}.${patch + 1}`
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
    this._guessRootComponent()
    return this.firstChild?.selectAll(selector) ?? []
  }
  selectOne(
    selector: string,
    opts?: { type?: "component" | "port" },
  ): PrimitiveComponent | null {
    this._guessRootComponent()
    return this.firstChild?.selectOne(selector, opts) ?? null
  }

  _eventListeners: Record<
    RootCircuitEventName,
    Array<(...args: any[]) => void>
  > = {} as Record<RootCircuitEventName, Array<(...args: any[]) => void>>

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

  removeListener(
    event: RootCircuitEventName,
    listener: (...args: any[]) => void,
  ) {
    if (!this._eventListeners[event]) return
    this._eventListeners[event] = this._eventListeners[event]!.filter(
      (l) => l !== listener,
    )
  }
  getClientOrigin(): string {
    if (typeof window !== "undefined") {
      return window.location.origin
    }
    if (typeof self !== "undefined") {
      return self.origin
    }
    return ""
  }
}

/**
 * @deprecated
 */
export const Project = RootCircuit

/**
 * We currently don't make a distinction between RootCircuit and Circuit, but
 * we may in the future allow subcircuits to be created as new Circuit then
 * incorporated into a larger RootCircuit
 */
export const Circuit = RootCircuit
