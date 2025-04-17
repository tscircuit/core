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
import cssSelect, { type Adapter, type Query } from "css-select"

export class RootCircuit {
  firstChild: PrimitiveComponent | null = null
  children: PrimitiveComponent[]
  db: CircuitJsonUtilObjects
  root: RootCircuit | null = null
  isRoot = true
  schematicDisabled = false
  pcbDisabled = false
  pcbRoutingDisabled = false
  private _selectorIndex: Query<PrimitiveComponent> | null = null
  private _selectorIndexNeedsRebuild = true

  /**
   * The RootCircuit name is usually set by the platform, it's not required but
   * if supplied can identify the circuit in certain effects, e.g. it is passed
   * as the display_name parameter for autorouting effects.
   */
  name?: string

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
    this.buildSelectorIndex() // Build index after render
  }

  invalidateSelectorIndex() {
    this._selectorIndexNeedsRebuild = true
    this._selectorIndex = null
  }

  buildSelectorIndex() {
    if (!this._selectorIndexNeedsRebuild || !this.firstChild) return
    this._selectorIndex = cssSelect.compile(
      "*", // Compile a dummy selector to get the Query object with the adapter
      { adapter: primitiveComponentAdapter },
    ) as Query<PrimitiveComponent> // Cast needed as compile signature is generic
    this._selectorIndexNeedsRebuild = false
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
      this.render() // This will rebuild the index if needed
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
    if (!this.firstChild) return []
    this.buildSelectorIndex() // Ensure index is up-to-date
    if (!this._selectorIndex) return [] // Should not happen if firstChild exists

  selectAll(
    selector: string,
    contextNode?: PrimitiveComponent,
  ): PrimitiveComponent[] {
    const context = contextNode ?? this.firstChild
    this._guessRootComponent() // Ensure firstChild is determined if context isn't provided
    if (!context) return []

    // Use cssSelect directly
    return cssSelect(selector, context, {
      adapter: primitiveComponentAdapter,
    }) as PrimitiveComponent[] // Cast needed as cssSelect is generic
  }

  selectOne(
    selector: string,
    opts?: { type?: string; port?: boolean },
    contextNode?: PrimitiveComponent,
  ): PrimitiveComponent | null {
    const context = contextNode ?? this.firstChild
    this._guessRootComponent() // Ensure firstChild is determined if context isn't provided
    if (!context) return null

    let type = opts?.type?.toLowerCase()
    if (opts?.port) type = "port"

    // Use cssSelect directly
    const results = cssSelect(selector, context, {
      adapter: primitiveComponentAdapter,
    }) as PrimitiveComponent[] // Cast needed

    if (type) {
      return (
        results.find(
          (c: PrimitiveComponent) => c.lowercaseComponentName === type,
        ) ?? null
      )
    }

    return results[0] ?? null
  }

  matchesSelector(
    component: PrimitiveComponent,
    selector: string,
  ): boolean {
    this.buildSelectorIndex() // Ensure index is up-to-date
    if (!this._selectorIndex) return false // Should not happen if component exists

    return this._selectorIndex.is(component, selector, {
      adapter: primitiveComponentAdapter,
    })
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

// Adapter for css-select to work with PrimitiveComponent
const primitiveComponentAdapter: Adapter<PrimitiveComponent, PrimitiveComponent> =
  {
    isTag: (node: PrimitiveComponent): node is PrimitiveComponent => true, // All our nodes are "tags"

    getAttributeValue: (
      node: PrimitiveComponent,
      name: string,
    ): string | undefined => {
      // Map selector attributes to component props
      if (name === "id") return node.props.id
      if (name === "name") return node.props.name // Allow selecting by specific name prop
      if (name === "pinNumber" && node.props.pinNumber !== undefined)
        return node.props.pinNumber.toString()
      if (name === "from" && node.props.from) return node.props.from
      if (name === "to" && node.props.to) return node.props.to
      // Add other relevant props as needed
      if (node.props[name] !== undefined) return String(node.props[name])
      return undefined
    },

    getChildren: (node: PrimitiveComponent): PrimitiveComponent[] => node.children,

    getName: (node: PrimitiveComponent): string => node.lowercaseComponentName, // Use lowercase name for tag matching

    getParent: (node: PrimitiveComponent): PrimitiveComponent | null =>
      node.parent,

    getSiblings: (node: PrimitiveComponent): PrimitiveComponent[] => {
      const parent = node.parent
      if (!parent) return [node] // Root node?
      return parent.children
    },

    getText: (node: PrimitiveComponent): string => "", // Not applicable

    hasAttrib: (node: PrimitiveComponent, name: string): boolean => {
      if (name === "id") return node.props.id !== undefined
      if (name === "name") return node.props.name !== undefined
      if (name === "pinNumber") return node.props.pinNumber !== undefined
      if (name === "from") return node.props.from !== undefined
      if (name === "to") return node.props.to !== undefined
      // Add other relevant props as needed
      return node.props[name] !== undefined
    },

    // Required methods, even if trivial
    removeSubsets: (nodes: PrimitiveComponent[]): PrimitiveComponent[] => nodes,
    findAll: (
      test: (node: PrimitiveComponent) => boolean,
      nodes: PrimitiveComponent[],
    ): PrimitiveComponent[] => {
      let result: PrimitiveComponent[] = []
      for (const node of nodes) {
        if (test(node)) {
          result.push(node)
        }
        result = result.concat(
          primitiveComponentAdapter.findAll(test, node.children),
        )
      }
      return result
    },
    findOne: (
      test: (node: PrimitiveComponent) => boolean,
      nodes: PrimitiveComponent[],
    ): PrimitiveComponent | null => {
      for (const node of nodes) {
        if (test(node)) {
          return node
        }
        const foundInChildren = primitiveComponentAdapter.findOne(
          test,
          node.children,
        )
        if (foundInChildren) {
          return foundInChildren
        }
      }
      return null
    },
    existsOne: (
      test: (node: PrimitiveComponent) => boolean,
      nodes: PrimitiveComponent[],
    ): boolean => {
      for (const node of nodes) {
        if (test(node) || primitiveComponentAdapter.existsOne(test, node.children)) {
          return true
        }
      }
      return false
    },

    // Add pseudo-class support for matching aliases/portHints as classes
    // This allows selectors like `.R1` or `.anode`
    isPseudoElement: () => false, // We don't support pseudo-elements like ::before
    isPseudoClass: (node: PrimitiveComponent, name: string): boolean => {
      // Treat aliases/portHints as classes
      return node.getNameAndAliases().includes(name)
    },
    getPseudoElements: () => [], // No pseudo-elements
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
