import type { PcbCircuitElement, PcbPostRoutingContext } from "@tscircuit/props"
import * as circuitJsonSchemas from "circuit-json"
import type { AnyCircuitElement, PcbComponent, PcbPort } from "circuit-json"
import { transformPCBElement } from "@tscircuit/circuit-json-util"
import type { ReactNode } from "react"
import { translate } from "transformation-matrix"
import {
  orderedRenderPhases,
  renderPhaseIndexMap,
} from "lib/components/base-components/Renderable"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { createInstancesFromReactNode } from "lib/fiber/create-instance-from-react-element"
import type { PcbPostRoutingStep } from "../PcbPostRoutingStep"
import type { Group } from "./Group"

type JournalEntry =
  | { kind: "insert"; type: string; id: string }
  | {
      kind: "update"
      type: string
      id: string
      /** Previous values of the patched keys; undefined restores an absent key */
      before: Record<string, unknown>
    }
  | { kind: "remove"; type: string; element: AnyCircuitElement }
  /** A primitive a render step added to the tree */
  | { kind: "instance"; component: PrimitiveComponent }

export interface PcbPostRoutingStepState {
  /** Every change the current run made, in order, so it can be undone */
  journal: JournalEntry[]
  /** Increments whenever a run is superseded; a stale run's context refuses edits */
  generation: number
}

const getState = (group: Group<any>): PcbPostRoutingStepState => {
  group._pcbPostRoutingStepState ??= { journal: [], generation: 0 }
  return group._pcbPostRoutingStepState
}

const idOf = (element: AnyCircuitElement) =>
  (element as any)[`${element.type}_id`] as string

const getTable = (group: Group<any>, type: string) => {
  const table = (group.root!.db as any)[type]
  if (!table?.insert) {
    throw new Error(`pcbpostroutingstep: unknown element type "${type}"`)
  }
  return table as {
    insert: (elm: any) => any
    update: (id: string, patch: any) => any
    delete: (id: string) => void
  }
}

const findElement = (group: Group<any>, id: string): AnyCircuitElement => {
  const element = group.root!.db.toArray().find((elm) => idOf(elm) === id)
  if (!element) {
    throw new Error(`pcbpostroutingstep: no element with id "${id}"`)
  }
  if (!element.type.startsWith("pcb_")) {
    throw new Error(
      `pcbpostroutingstep: only pcb_* elements can be changed, "${id}" is a ${element.type}`,
    )
  }
  return element
}

/** Validates an element against its circuit-json schema; returns the parsed (defaulted) element. */
const validate = (element: Record<string, unknown>) => {
  const type = element.type as string
  const schema =
    (circuitJsonSchemas as any)[type] ?? circuitJsonSchemas.any_circuit_element
  const result = schema.safeParse(element)
  if (!result.success) {
    throw new Error(
      `pcbpostroutingstep: invalid ${type}: ${result.error.message}`,
    )
  }
  return result.data as Record<string, unknown>
}

/** Takes a primitive a render step added back out of the tree. */
const detachInstance = (component: PrimitiveComponent) => {
  const visit = (node: PrimitiveComponent) => {
    const port = (node as any).matchedPort as
      | { matchedComponents: PrimitiveComponent[] }
      | null
      | undefined
    if (port) {
      port.matchedComponents = port.matchedComponents.filter((c) => c !== node)
    }
    for (const child of node.children) visit(child as PrimitiveComponent)
  }
  visit(component)
  const parent = component.parent as PrimitiveComponent | null
  if (!parent) return
  parent.children = parent.children.filter((c) => c !== component)
  ;(parent as any)._childrenVersion++
  ;(parent as any)._clearSelectorCachesUpTree?.()
  component.shouldBeRemoved = true
}

/** Undoes the steps' recorded changes, newest first, restoring the routed board. */
export function Group_undoPcbPostRoutingSteps(group: Group<any>): void {
  const state = group._pcbPostRoutingStepState
  if (!state || !group.root) return
  state.generation++
  const journal = state.journal
  state.journal = []
  for (const entry of journal.reverse()) {
    if (entry.kind === "instance") {
      detachInstance(entry.component)
      continue
    }
    const table = getTable(group, entry.type)
    if (entry.kind === "insert") {
      table.delete(entry.id)
    } else if (entry.kind === "update") {
      table.update(entry.id, entry.before)
    } else {
      // insert keeps the element's own id
      table.insert(entry.element)
    }
  }
}

const createContext = (
  group: Group<any>,
  state: PcbPostRoutingStepState,
  generation: number,
): PcbPostRoutingContext => {
  const assertCurrent = () => {
    if (state.generation !== generation) {
      throw new Error(
        "pcbpostroutingstep: this run was superseded (the board changed and the steps run again); its changes are discarded",
      )
    }
  }
  const { db } = group.root!
  const pcbPortFor = (selector: string) => {
    const port = group.selectOne(selector, { port: true }) as {
      pcb_port_id?: string | null
    } | null
    return port?.pcb_port_id ? db.pcb_port.get(port.pcb_port_id) : null
  }

  return {
    subcircuitId: group.subcircuit_id ?? undefined,
    getCircuitJson: () =>
      structuredClone(group.root!.db.toArray()) as AnyCircuitElement[],
    getPcbPort: (selector) =>
      (structuredClone(pcbPortFor(selector)) as PcbPort | null) ?? undefined,
    getPcbComponent: (selector) => {
      const component = group.selectOne(selector) as {
        pcb_component_id?: string | null
      } | null
      const pcbComponent = component?.pcb_component_id
        ? db.pcb_component.get(component.pcb_component_id)
        : null
      return (structuredClone(pcbComponent) as PcbComponent | null) ?? undefined
    },
    insert: ((element: Record<string, unknown>) => {
      assertCurrent()
      const type = String(element.type ?? "")
      if (!type.startsWith("pcb_")) {
        throw new Error(
          `pcbpostroutingstep: insert takes pcb_* elements, not "${type}"`,
        )
      }
      const idKey = `${type}_id`
      if (idKey in element) {
        throw new Error(
          `pcbpostroutingstep: ${idKey} is generated; leave it out`,
        )
      }
      const { [idKey]: _candidate, ...parsed } = validate({
        subcircuit_id: group.subcircuit_id ?? undefined,
        ...element,
        [idKey]: `${type}_post_routing_candidate`,
      })
      const inserted = getTable(group, type).insert(parsed)
      state.journal.push({ kind: "insert", type, id: inserted[idKey] })
      return structuredClone(inserted)
    }) as PcbPostRoutingContext["insert"],
    update: (id, patch) => {
      assertCurrent()
      const element = findElement(group, id) as Record<string, any>
      const idKey = `${element.type}_id`
      if ("type" in patch || idKey in patch) {
        throw new Error(
          `pcbpostroutingstep: update cannot change type or ${idKey}`,
        )
      }
      validate({ ...element, ...patch })
      const before = Object.fromEntries(
        Object.keys(patch).map((key) => [key, element[key]]),
      )
      getTable(group, element.type).update(id, patch)
      state.journal.push({ kind: "update", type: element.type, id, before })
      return structuredClone(findElement(group, id)) as PcbCircuitElement
    },
    remove: (id) => {
      assertCurrent()
      const element = findElement(group, id)
      state.journal.push({
        kind: "remove",
        type: element.type,
        element: structuredClone(element),
      })
      getTable(group, element.type).delete(id)
    },
  }
}

const stepPhaseIndex = renderPhaseIndexMap.get("PcbPostRoutingStepRender")!

/**
 * Adds a render step's JSX beside the step and renders it up to this phase
 * right away, so copper pours and design rule checks see it. Only PCB
 * primitives are accepted: anything else would need placement and routing.
 */
const renderPrimitives = (
  group: Group<any>,
  state: PcbPostRoutingStepState,
  step: PcbPostRoutingStep,
  node: ReactNode,
) => {
  const instances = createInstancesFromReactNode(node) as PrimitiveComponent[]
  if (instances.length === 0) return
  const assertPrimitive = (component: PrimitiveComponent) => {
    if (!component.isPcbPrimitive) {
      throw new Error(
        `pcbpostroutingstep: render may only return PCB primitives (pads, holes, silkscreen, notes...), not <${component.lowercaseComponentName}>`,
      )
    }
    for (const child of component.children) {
      assertPrimitive(child as PrimitiveComponent)
    }
  }
  instances.forEach(assertPrimitive)

  const { db } = group.root!
  const before = new Set(db.toArray().map(idOf))
  const parent = step.parent as PrimitiveComponent
  for (const instance of instances) {
    parent.add(instance)
    state.journal.push({ kind: "instance", component: instance })
  }
  for (const phase of orderedRenderPhases.slice(0, stepPhaseIndex + 1)) {
    for (const instance of instances) {
      instance.runRenderPhaseForChildren(phase)
      instance.runRenderPhase(phase)
    }
  }
  const added = db.toArray().filter((element) => !before.has(idOf(element)))

  // Primitives are placed with the component's position before layout; follow
  // the component if a layout has moved it since
  const container = parent.getPrimitiveContainer()
  const pcbComponent = container?.pcb_component_id
    ? db.pcb_component.get(container.pcb_component_id)
    : null
  if (container && pcbComponent) {
    const planned = container._getGlobalPcbPositionBeforeLayout()
    const dx = pcbComponent.center.x - planned.x
    const dy = pcbComponent.center.y - planned.y
    if (Math.abs(dx) > 1e-9 || Math.abs(dy) > 1e-9) {
      for (const element of added) {
        const moved = transformPCBElement(
          structuredClone(element) as any,
          translate(dx, dy),
        )
        getTable(group, element.type).update(idOf(element), moved)
      }
    }
  }
  for (const element of added) {
    state.journal.push({
      kind: "insert",
      type: element.type,
      id: idOf(element),
    })
  }
}

/** Records a failure as a pcb_autorouting_error; journaled, so a re-run replaces it. */
const recordStepError = (
  group: Group<any>,
  state: PcbPostRoutingStepState,
  step: PcbPostRoutingStep,
  error: unknown,
) => {
  const message = error instanceof Error ? error.message : String(error)
  const name = step._parsedProps.name
  const inserted = group.root!.db.pcb_autorouting_error.insert({
    pcb_error_id: `pcb_post_routing_step_error_${step._renderId}`,
    error_type: "pcb_autorouting_error",
    message: `<pcbpostroutingstep${name ? ` name="${name}"` : ""} /> failed: ${message}`,
    subcircuit_id: group.subcircuit_id ?? undefined,
  })
  state.journal.push({
    kind: "insert",
    type: "pcb_autorouting_error",
    // the db keys every table by <type>_id, alongside the schema's pcb_error_id
    id: (inserted as unknown as { pcb_autorouting_error_id: string })
      .pcb_autorouting_error_id,
  })
}

/**
 * The steps this board or subcircuit runs, including those inside its
 * components. selectAll stops at nested subcircuits, which run their own.
 */
const getSteps = (group: Group<any>): PcbPostRoutingStep[] => {
  const steps = group.selectAll("pcbpostroutingstep") as PcbPostRoutingStep[]
  // Array.prototype.sort is stable: equal orders keep document order
  return steps.sort(
    (a, b) => (a._parsedProps.order ?? 0) - (b._parsedProps.order ?? 0),
  )
}

/**
 * Runs the subcircuit's <pcbpostroutingstep /> elements, in order, once routing
 * and teardrops are done and before copper pours, via stitching and PCB design
 * rule checks. Steps run inline until one returns a promise; that step and the
 * rest then run in order as one async effect the later phases wait for.
 * Before a re-run the previous run's changes are undone (see Group._markDirty).
 */
export function Group_doInitialPcbPostRoutingStepRender(
  group: Group<any>,
): void {
  if (!group.isSubcircuit || !group.root) return
  if (group.root.pcbDisabled || group._isInflatedFromCircuitJson) return
  // never show user code a half-routed board; routing completion re-runs this phase
  if (group._isPcbRoutingPending()) return
  const steps = getSteps(group)
  if (steps.length === 0) return

  const state = getState(group)
  // normally already undone when the phase was marked dirty
  Group_undoPcbPostRoutingSteps(group)
  const generation = state.generation
  const context = createContext(group, state, generation)
  const isCurrent = () => state.generation === generation

  const runStep = (step: PcbPostRoutingStep): void | Promise<void> => {
    const { fn, render } = step._parsedProps
    const afterFn = () => {
      if (!render) return
      const node = render(context)
      if (!(node instanceof Promise)) {
        renderPrimitives(group, state, step, node)
        return
      }
      return node.then((resolved) => {
        if (!isCurrent()) return
        renderPrimitives(group, state, step, resolved)
      })
    }
    const fnResult = fn?.(context)
    return fnResult instanceof Promise ? fnResult.then(afterFn) : afterFn()
  }

  for (let i = 0; i < steps.length; i++) {
    let result: void | Promise<void>
    try {
      result = runStep(steps[i])
    } catch (error) {
      recordStepError(group, state, steps[i], error)
      continue
    }
    if (!(result instanceof Promise)) continue
    const pending = result
    const rest = steps.slice(i + 1)
    group._queueAsyncEffect("pcb-post-routing-steps", async () => {
      try {
        await pending
      } catch (error) {
        // a superseded run's failure is expected and its changes are discarded
        if (isCurrent()) recordStepError(group, state, steps[i], error)
      }
      for (const step of rest) {
        if (!isCurrent()) return
        try {
          await runStep(step)
        } catch (error) {
          if (isCurrent()) recordStepError(group, state, step, error)
        }
      }
    })
    return
  }
}
