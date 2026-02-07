import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { su } from "@tscircuit/circuit-json-util"
import type { PlatformConfig } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import Debug from "debug"
import { type ReactElement, isValidElement } from "react"
import { type Matrix, identity } from "transformation-matrix"
import pkgJson from "../package.json"
import type { PrimitiveComponent } from "./components/base-components/PrimitiveComponent"
import type { RenderPhase } from "./components/base-components/Renderable"
import type { BoardI } from "./components/normal-components/BoardI"
import { Group } from "./components/primitive-components/Group"
import type { RootCircuitEventName } from "./events"
import { createInstanceFromReactElement } from "./fiber/create-instance-from-react-element"

export class IsolatedCircuit {
  firstChild: PrimitiveComponent | null = null
  children: PrimitiveComponent[]
  db: CircuitJsonUtilObjects
  root: IsolatedCircuit | null = null
  isRoot = false
  private _schematicDisabledOverride: boolean | undefined
  get schematicDisabled(): boolean {
    if (this._schematicDisabledOverride !== undefined) {
      return this._schematicDisabledOverride
    }

    const board = this._getBoard() as
      | { _parsedProps?: { schematicDisabled?: boolean } }
      | undefined

    return board?._parsedProps?.schematicDisabled ?? false
  }

  set schematicDisabled(value: boolean) {
    this._schematicDisabledOverride = value
  }
  pcbDisabled = false
  pcbRoutingDisabled = false

  _featureMspSchematicTraceRouting = true

  /**
   * The IsolatedCircuit name is usually set by the platform, it's not required but
   * if supplied can identify the circuit in certain effects, e.g. it is passed
   * as the display_name parameter for autorouting effects.
   */
  name?: string

  platform?: PlatformConfig

  /**
   * Optional URL pointing to where this project is hosted or documented.
   * When provided it is stored in the source_project_metadata.project_url field
   * of the generated Circuit JSON.
   */
  projectUrl?: string

  _hasRenderedAtleastOnce = false
  private _asyncEffectIdsByPhase = new Map<RenderPhase, Set<string>>()
  private _asyncEffectPhaseById = new Map<string, RenderPhase>()

  constructor({
    platform,
    projectUrl,
  }: { platform?: PlatformConfig; projectUrl?: string } = {}) {
    this.children = []
    this.db = su([])
    this.platform = platform
    this.projectUrl = projectUrl
    this.pcbDisabled = platform?.pcbDisabled ?? false
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

  setPlatform(platform: Partial<PlatformConfig>) {
    this.platform = {
      ...this.platform,
      ...platform,
    }
  }

  /**
   * Get the main board for this Circuit.
   */
  _getBoard(): (PrimitiveComponent & BoardI) | undefined {
    const directBoard = this.children.find((c) => c.componentName === "Board")
    if (directBoard) {
      return directBoard as any
    }

    return undefined
  }

  _guessRootComponent() {
    if (this.firstChild) return
    if (this.children.length === 0) {
      throw new Error(
        "Not able to guess root component: IsolatedCircuit has no children (use circuit.add(...))",
      )
    }

    const panels = this.children.filter(
      (child) => child.lowercaseComponentName === "panel",
    )

    if (panels.length > 1) {
      throw new Error("Only one <panel> is allowed per circuit")
    }

    if (panels.length === 1) {
      if (this.children.length !== 1) {
        throw new Error("<panel> must be the root element of the circuit")
      }

      this.firstChild = panels[0]
      return
    }

    if (this.children.length === 1 && this.children[0].isGroup) {
      this.firstChild = this.children[0]
      return
    }

    const group = new Group({ subcircuit: true })
    group.parent = this as any
    group.addAll(this.children)
    this.children = [group]
    this.firstChild = group
  }

  render() {
    if (!this.firstChild) {
      this._guessRootComponent()
    }
    const { firstChild, db } = this
    if (!firstChild) throw new Error("IsolatedCircuit has no root component")
    firstChild.parent = this as any
    firstChild.runRenderCycle()
    this._hasRenderedAtleastOnce = true
  }

  async renderUntilSettled(): Promise<void> {
    const existing = this.db.source_project_metadata.list()?.[0]
    if (!existing) {
      this.db.source_project_metadata.insert({
        software_used_string: `@tscircuit/core@${this.getCoreVersion()}`,
        ...(this.projectUrl ? { project_url: this.projectUrl } : {}),
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
    if (this._asyncEffectPhaseById.size > 0) return true
    return this.children.some((child) => child._hasIncompleteAsyncEffects())
  }

  _hasIncompleteAsyncEffectsForPhase(phase: RenderPhase): boolean {
    return (this._asyncEffectIdsByPhase.get(phase)?.size ?? 0) > 0
  }

  getCircuitJson(): AnyCircuitElement[] {
    if (!this._hasRenderedAtleastOnce) this.render()
    return this.db.toArray()
  }

  toJson(): AnyCircuitElement[] {
    return this.getCircuitJson()
  }

  async getSvg(options: {
    view: "pcb" | "schematic"
    layer?: string
  }): Promise<string> {
    const circuitToSvg = await import("circuit-to-svg").catch((e) => {
      throw new Error(
        `To use circuit.getSvg, you must install the "circuit-to-svg" package.\n\n"${e.message}"`,
      )
    })

    if (options.view === "pcb") {
      return circuitToSvg.convertCircuitJsonToPcbSvg(this.getCircuitJson())
    }
    if (options.view === "schematic") {
      return circuitToSvg.convertCircuitJsonToSchematicSvg(
        this.getCircuitJson(),
      )
    }
    throw new Error(`Invalid view: ${options.view}`)
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
    if (event === "asyncEffect:start") {
      this._registerAsyncEffectStart(args[0] as { asyncEffectId?: string })
    } else if (event === "asyncEffect:end") {
      this._registerAsyncEffectEnd(args[0] as { asyncEffectId?: string })
    }
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

  enableDebug(debug: string | null | false) {
    if (typeof debug === "string") {
      Debug.enable(debug)
    } else if (debug === null || debug === false) {
      Debug.disable()
    }
  }

  getClientOrigin(): string {
    if (typeof window !== "undefined" && window.location) {
      return window.location.origin
    }
    if (typeof self !== "undefined" && (self as any).location) {
      return (self as any).location.origin
    }
    return ""
  }

  private _registerAsyncEffectStart(payload: {
    asyncEffectId?: string
    phase?: RenderPhase
  }) {
    if (!payload?.asyncEffectId || !payload.phase) return
    const { asyncEffectId, phase } = payload
    const existingPhase = this._asyncEffectPhaseById.get(asyncEffectId)
    if (existingPhase && existingPhase !== phase) {
      this._asyncEffectIdsByPhase.get(existingPhase)?.delete(asyncEffectId)
    }
    if (!this._asyncEffectIdsByPhase.has(phase)) {
      this._asyncEffectIdsByPhase.set(phase, new Set())
    }
    this._asyncEffectIdsByPhase.get(phase)!.add(asyncEffectId)
    this._asyncEffectPhaseById.set(asyncEffectId, phase)
  }

  private _registerAsyncEffectEnd(payload: {
    asyncEffectId?: string
    phase?: RenderPhase
  }) {
    if (!payload?.asyncEffectId) return
    const { asyncEffectId } = payload
    const phase = this._asyncEffectPhaseById.get(asyncEffectId) ?? payload.phase
    if (phase) {
      const phaseSet = this._asyncEffectIdsByPhase.get(phase)
      phaseSet?.delete(asyncEffectId)
      if (phaseSet && phaseSet.size === 0) {
        this._asyncEffectIdsByPhase.delete(phase)
      }
    }
    this._asyncEffectPhaseById.delete(asyncEffectId)
  }
}
