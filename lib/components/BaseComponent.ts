import type { AnySoupElement, AnySourceComponent } from "@tscircuit/soup"
import type { Project } from "../Project"
import type { ZodType } from "zod"
import { z } from "zod"
import { symbols, type SchSymbol, type BaseSymbolName } from "schematic-symbols"
import { isValidElement as isReactElement } from "react"
import type { Footprint } from "./Footprint"
import { fp } from "footprinter"
import { createComponentsFromSoup } from "../utils/createComponentsFromSoup"
import type { Port } from "./Port"

export interface BaseComponentConfig {
  schematicSymbolName?: BaseSymbolName | null
  zodProps: ZodType
  sourceFtype?: AnySourceComponent["ftype"] | null
}

export type PortMap<T extends string> = {
  [K in T]: Port
}

type RenderPhase =
  | "SourceRender"
  | "PortMatching"
  | "SchematicComponentRender"
  | "SchematicTraceRender"
  | "PcbComponentRender"
  | "PcbTraceRender"
  | "CadModelRender"
  | "PcbAnalysis"

type RenderPhaseStates = Record<RenderPhase, { initialized: boolean }>

type RenderPhaseFunctions = {
  [K in RenderPhase as
    | `doInitial${K}`
    | `update${K}`
    | `remove${K}`]: () => void
}

export abstract class BaseComponent<
  ZodProps extends ZodType = any,
  PortNames extends string = never,
> implements RenderPhaseFunctions
{
  parent: BaseComponent | null = null
  children: BaseComponent[]
  childrenPendingRemoval: BaseComponent[]

  get config(): BaseComponentConfig {
    return {
      zodProps: z.object({}).passthrough(),
    }
  }

  get portMap(): PortMap<PortNames> {
    return new Proxy(
      {},
      {
        get: (target, prop): Port => {
          const port = this.children.find(
            (c) =>
              c.componentName === "Port" &&
              (c as Port).doesMatchName(prop as string),
          )
          if (!port) {
            throw new Error(
              `There was an issue finding the port "${prop.toString()}" inside of a ${this.componentName} component with name: "${this.props.name}". This is a bug in @tscircuit/core`,
            )
          }
          return port as Port
        },
      },
    ) as any
  }

  project: Project | null = null
  props: z.infer<ZodProps>

  isStale = true
  shouldBeRemoved = false

  renderPhaseStates: RenderPhaseStates

  componentName = ""

  source_group_id: string | null = null
  source_component_id: string | null = null
  schematic_component_id: string | null = null
  pcb_component_id: string | null = null
  cad_component_id: string | null = null

  constructor(props: z.input<ZodProps>) {
    this.children = []
    this.childrenPendingRemoval = []
    this.props = this.config.zodProps.parse(props) as z.infer<ZodProps>
    this.renderPhaseStates = {
      SourceRender: { initialized: false },
      PortMatching: { initialized: false },
      SchematicComponentRender: { initialized: false },
      SchematicTraceRender: { initialized: false },
      PcbComponentRender: { initialized: false },
      PcbTraceRender: { initialized: false },
      CadModelRender: { initialized: false },
      PcbAnalysis: { initialized: false },
    }
    if (!this.componentName) {
      this.componentName = this.constructor.name
    }
    this.afterCreate()
    this.initPorts()
  }
  updatePcbAnalysis() {}
  removePcbAnalysis() {}
  doInitialPcbAnalysis() {}

  updatePortMatching() {}
  removePortMatching() {}
  updateCadModelRender() {}
  removeCadModelRender() {}

  doInitialPortMatching() {
    this.runRenderPhaseForChildren("PortMatching")
  }
  doInitialCadModelRender() {
    this.runRenderPhaseForChildren("CadModelRender")
  }

  setProject(project: Project) {
    this.project = project
    for (const c of this.children) {
      c.setProject(project)
    }
  }

  setProps(props: Partial<z.input<ZodProps>>) {
    const newProps = this.config.zodProps.parse({
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

  initPorts() {}

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

  doSimpleInitialSourceRender({
    ftype,
  }: { ftype: AnySourceComponent["ftype"] }) {
    const { db } = this.project!
    const { props } = this
    const source_component = db.source_component.insert({
      ftype,
      name: props.name,
      manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
      supplier_part_numbers: props.supplierPartNumbers,
    })
    this.source_component_id = source_component.source_component_id
  }

  /**
   * Render the source_* elements for this component.
   *
   * Make sure to set this.source_component_id if you override this method!
   */
  doInitialSourceRender() {
    if (this.config.sourceFtype) {
      this.doSimpleInitialSourceRender({ ftype: this.config.sourceFtype })
    }
    this.runRenderPhaseForChildren("SourceRender")
  }

  doPortMatching() {
    this.runRenderPhaseForChildren("PortMatching")
  }

  doInitialSchematicComponentRender() {
    const { db } = this.project!
    if (this.config.schematicSymbolName) {
      // TODO switch between horizontal and vertical based on schRotation
      const symbol_name = `${this.config.schematicSymbolName}_horz`

      const symbol = (symbols as any)[symbol_name] as SchSymbol | undefined

      if (!symbol) {
        throw new Error(`Could not find schematic-symbol "${symbol_name}"`)
      }

      const schematic_component = db.schematic_component.insert({
        center: { x: this.props.schX ?? 0, y: this.props.schY ?? 0 },
        rotation: this.props.schRotation ?? 0,
        size: symbol.size,
        source_component_id: this.source_component_id!,

        // @ts-ignore
        symbol_name,
      })
      this.schematic_component_id = schematic_component.schematic_component_id
    }
    this.runRenderPhaseForChildren("SchematicComponentRender")
  }

  doInitialPcbComponentRender() {
    const { footprint } = this.props
    if (footprint) {
      if (typeof footprint === "string") {
        const fpSoup = fp.string(footprint).soup()
        // TODO save some kind of state to prevent re-creating the same components
        // and knowing when the string has changed
        const fpComponents = createComponentsFromSoup(fpSoup)
        this.children.push(...fpComponents)
      } else if (footprint.componentName === "Footprint") {
        const fp = footprint as Footprint
        if (!this.children.includes(fp)) {
          this.children.push(fp)
        }
      } else if (isReactElement(footprint)) {
        // TODO, maybe call .add() with the footprint?
      }
    }
    this.runRenderPhaseForChildren("PcbComponentRender")
  }

  /**
   * This runs all the render methods for a given phase, calling one of:
   * - doInitial*
   * - update*
   *  -remove*
   *  ...depending on the current state of the component.
   */
  runRenderPhase(phase: RenderPhase) {
    const isInitialized = this.renderPhaseStates[phase].initialized
    if (!isInitialized && this.shouldBeRemoved) return
    if (this.shouldBeRemoved && isInitialized) {
      ;(this as any)[`remove${phase}`]()
      this.renderPhaseStates[phase].initialized = false
      return
    }
    if (isInitialized) {
      ;(this as any)[`update${phase}`]()
      this.renderPhaseStates[phase].initialized = true
      return
    }
    ;(this as any)[`doInitial${phase}`]()
  }

  runRenderPhaseForChildren(phase: RenderPhase) {
    for (const child of this.children) {
      child.runRenderPhase(phase)
    }
  }

  doInitialSchematicTraceRender() {
    this.runRenderPhaseForChildren("SchematicTraceRender")
  }

  doInitialPcbTraceRender() {
    this.runRenderPhaseForChildren("PcbTraceRender")
  }

  doInitialCadRender() {
    if (this.props.cadModel) {
      // TODO
    }
  }

  updateSourceRender() {
    this.runRenderPhaseForChildren("SourceRender")
  }

  /**
   * Called whenever a component is stale and needs to be rendered
   */
  updateSchematicComponentRender() {
    this.runRenderPhaseForChildren("SchematicComponentRender")
  }

  updateSchematicTraceRender() {
    this.runRenderPhaseForChildren("SchematicTraceRender")
  }

  updatePcbComponentRender() {
    this.runRenderPhaseForChildren("PcbComponentRender")
  }

  updatePcbTraceRender() {
    this.runRenderPhaseForChildren("PcbTraceRender")
  }

  removeSourceRender() {
    this.runRenderPhaseForChildren("SourceRender")
  }

  removeSchematicComponentRender() {
    this.runRenderPhaseForChildren("SchematicComponentRender")
  }

  removeSchematicTraceRender() {
    this.runRenderPhaseForChildren("SchematicTraceRender")
  }

  removePcbComponentRender() {
    this.runRenderPhaseForChildren("PcbComponentRender")
  }

  removePcbTraceRender() {
    this.runRenderPhaseForChildren("PcbTraceRender")
  }

  onChildChanged(child: BaseComponent) {
    this.isStale = true
    this.parent?.onChildChanged(child)
  }

  add(component: BaseComponent) {
    component.onAddToParent(this)
    this.children.push(component)
    this.isStale = true
  }

  remove(component: BaseComponent) {
    this.children = this.children.filter((c) => c !== component)
    this.childrenPendingRemoval.push(component)
    component.shouldBeRemoved = true
    this.isStale = true
  }

  doesSelectorMatch(selector: string): boolean {
    const myTypeNames = [this.componentName, this.componentName.toLowerCase()]
    const myClassNames = [this.props.name].filter(Boolean)

    const parts = selector.trim().split(/\> /)[0]
    const firstPart = parts[0]

    if (parts.length > 1) return false
    if (selector === "*") return true
    if (selector[0] === "#" && selector.slice(1) === this.props.id) return true
    if (selector[0] === "." && myClassNames.includes(selector.slice(1)))
      return true
    if (/^[a-zA-Z0-9_]/.test(firstPart) && myTypeNames.includes(firstPart))
      return true

    return false
  }

  selectAll(selector: string): BaseComponent[] {
    const parts = selector.split(/\> /)[0]
    const firstPart = parts[0]
    const otherParts = selector.replace(firstPart, "")
    const myTypeNames = [this.componentName, this.componentName.toLowerCase()]
    const myClassNames = [this.props.name].filter(Boolean)

    if (selector === "*") {
      return this.getDescendants()
    }
    if (firstPart.startsWith("#") && parts.length === 1) {
      const id = firstPart.slice(1)
      return this.getDescendants().filter((c) => c.props.id === id)
    }

    // e.g. group > .AnotherGroup > led.anode
    if (firstPart.startsWith(".") || /^[a-zA-Z0-9_]/.test(firstPart)) {
      const isMatchingMe = this.doesSelectorMatch(firstPart)
      if (isMatchingMe && parts.length === 1) {
        // TODO: technically, descendants could contain sub-classes with the
        // same name, but that edge case seems like bad practice anyway...
        return [this]
      }
      if (isMatchingMe) {
        return this.children.flatMap((c) => c.selectAll(otherParts))
      }

      if (otherParts.trim().startsWith(">")) {
        const childrenSelector = otherParts.trim().slice(1)
        const childrenSelectorFirstPart = childrenSelector.split(/\> /)[0]
        return this.children
          .filter((c) => c.doesSelectorMatch(childrenSelectorFirstPart))
          .flatMap((c) => c.selectAll(childrenSelector))
      }
      return this.children.flatMap((c) => c.selectAll(otherParts))
    }

    throw new Error(`Could not handle selector "${selector}"`)
  }

  selectOne(selector: string): BaseComponent | null {
    return this.selectAll(selector)[0] ?? null
  }

  getDescendants(): BaseComponent[] {
    const descendants: BaseComponent[] = []
    for (const child of this.children) {
      descendants.push(child)
      descendants.push(...child.getDescendants())
    }
    return descendants
  }

  getString(): string {
    const { componentName, props, parent } = this
    return `${componentName}(.${parent?.props.name} > .${props.name})`
  }
  get [Symbol.toStringTag](): string {
    return this.getString()
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.getString()
  }
}
